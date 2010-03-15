
var SSFrontend = {};

(function($) {
	
	var ssEditor = null;
	
	SSFrontend.FrontendEditor = function (options) {
		if (ssEditor != null) {
			throw "Can only create a single instance of the frontend editor.";
		}

		ssEditor = this;
		this.options = options;

		this.wysiwygElements = options.editorClass || "__wysiwyg-editable";
		this.pageEditor = null;

		this.nicInstances = [];
		this.init();

	};

	SSFrontend.FrontendEditor.prototype = {
		init: function () {
			var $this = this;
			var autoSaveTimer = null;
			
			this.registerPlugins();
			this.initialiseToolbars();

		},

		maskScreen: function () {
			var dialogMask = $('#__editor-mask');
			// create the backdrop
			if (dialogMask.length == 0) {
				dialogMask = $('<div id="__editor-mask"></div>').appendTo('body');
			}

			var maskHeight = $(document).height();
			var maskWidth = $(window).width();

			//Set height and width to mask to fill up the whole screen
			dialogMask.css({'width':maskWidth,'height':maskHeight});

			dialogMask.fadeIn(50);
			dialogMask.fadeTo("fast",0.8);
		},
		clearMask: function () {
			$('#__editor-mask').hide();
		},

		initialiseToolbars: function () {
			var $this = this;
			var autoSaveTimer = null;

			var firstChild = $('body').children()[0];

			if (firstChild != null) {
				var toolboxBuffer = $("<div id='__toolbox-buffer' style=''></div>").prependTo($('body'));
				var toolbox = $("<div id='__toolbox'></div>").prependTo($('body'));
				toolbox.append("<img id='__ajax-load' src='frontend-editing/javascript/ajax-loader.gif' /><div id='__message-box'></div>");
				toolbox.append("<div id='__toolboxcontent'><div id='__editor-panel' ></div></div>");

				var toolboxCloser = $('#FE_SwitchOff').hide();
				if (toolboxCloser.length == 0) {
					toolboxCloser = $("<div id='__toolbox-control'></div>").appendTo(toolbox);
				}

				var toolboxOpener = $('#FE_SwitchOn');
				if (toolboxOpener.length == 0) {
					toolboxOpener = $("<div id='__toolbox-opener'>Show Editor</div>").prependTo($('body'));
				}

				// when closing
				toolboxCloser.click(
					function() {
						$this.maskScreen();
						toolbox.hide();
						toolboxBuffer.hide();
						toolboxCloser.hide();
						toolboxOpener.show();

						$this.unconvertEditableRegions();

						if (autoSaveTimer != null) {
							clearInterval(autoSaveTimer);
						}

						// delay the clearing of the mask - makes sure that everything has inited and stuff...
						// It's also somewhat deliberate so that users have a moment to register that yes, there's something
						// completely different about the interface now
						setTimeout(function () {
							$this.clearMask();
						}, 500);
					}
				);

				// when opening
				toolboxOpener.click(
					function() {
						$this.maskScreen();
						$this.convertEditableRegions();

						toolbox.show();
						toolboxBuffer.show();
						toolboxOpener.hide();
						toolboxCloser.show();

						// auto save every 3 minutes
						autoSaveTimer = setInterval(function () {
							// autosave!
						}, 180000);
						
						// delay the clearing of the mask - makes sure that everything has inited and stuff...
						// It's also somewhat deliberate so that users have a moment to register that yes, there's something
						// completely different about the interface now
						setTimeout(function () {
							$this.clearMask();
						}, 500);
					}
				);

				$('#__ajax-load').ajaxStart(function() {jQuery(this).show();});
				$('#__ajax-load').ajaxStop(function() {jQuery(this).hide();});

				// and finally, show the toolbox if we were opened in direct editing mode
				if (location.href.indexOf('startEditing=true') > 0) {
					toolboxOpener.click();
				}
			}
		},

		/**
		 * Converts regions into WYSIWYG cells
		 * TODO: Needs a big cleanup to properly move relevant code out into a modular structure. This
		 * should also handle non-wysiwyg fields.
		 */
		convertEditableRegions: function () {
			
			var buttons = ['sssave','bold','italic','underline','left','center',
	       		'right','justify','ol','ul','fontSize','fontFamily','fontFormat',
	       		'indent','outdent','insertlink','unlink','insertimage', 'forecolor',
	       		'bgcolor','xhtml', 'table'];
	       	var icons = {"xhtml":1,"bgcolor":2,"forecolor":3,"bold":4,"center":5,
	       		"hr":6,"indent":7,"italic":8,"justify":9,"left":10,"ol":11,"outdent":12,
	       		"removeformat":13,"right":14,"sssave":25,"strikethrough":16,"subscript":17,
	       		"superscript":18,"ul":19,"underline":20,"image":21,"insertimage":21,"link":22,"unlink":23,
	       		"close":24,"arrow":26,"insertlink": 22}
	       	var $this = this;
	       	this.pageEditor = new nicEditor({buttonList: buttons, iconList: icons, iconsPath: 'frontend-editing/javascript/nicEditorIcons.gif'});
	       	this.pageEditor.setPanel('__editor-panel');
	       	$('.'+$this.wysiwygElements).each(function () {
				$this.pageEditor.addInstance(this);
				var elemParams = $(this).attr("id").split("|");
				var typeInfo = elemParams[0] + '-' + elemParams[2];
				$this.updateFieldContents(this, typeInfo, 'raw');
	       	});
		},

		/**
		 * Do the reverse of the above - make sure everything's back to 'normal' for the page
		 */
		unconvertEditableRegions: function () {
			var $this = this;
			// remove all editor bits and pieces
			var nicInstances = this.getEditorInstances();
			for (var i = 0; i < nicInstances.length; i++) {
				nicInstances[i].remove();
			}
			$('#__editor-panel').html("");
			// reset the global cache of editors
			nicEditors.editors = [];

			$('.'+$this.wysiwygElements).each(function () {
				var elemParams = $(this).attr("id").split("|");
				var typeInfo = elemParams[0] + '-' + elemParams[2];
				$this.updateFieldContents(this, typeInfo, 'escaped');
	       	});
		},

		updateFieldContents: function (element, typeInfo, format) {
			var $this = this;
			var request = $this.options.contentUrl + '/' + typeInfo + '/' + format;
			$.get(request, {}, function (data) {
				var response = $.parseJSON(data);
				if (!response.success) {
					alert("There was an error initialising the data for " + typeInfo);
				} else {
					$(element).html(response.data);
				}
			});
		},

		/**
		 * Get all the editor instances being managed by this editor
		 * @return
		 */
		getEditorInstances: function () {
			if (this.pageEditor != null && this.pageEditor.nicInstances != null) {
				return this.pageEditor.nicInstances;
			}
			return new Array();
		},

		saveContents: function (content, id, selectedInstances) {
			var $this = this;
			var instances = this.getEditorInstances();
			// get all the editors and package them up for saving
			var postArgs = {};

			if (instances.length > 0) {
				for (var i = 0, c = instances.length; i < c; i++) {
					elemParams = $(instances[i].elm).attr("id").split("|");
					var pagePath = elemParams[0];
					var pageId = elemParams[1];
					var pageElement = elemParams[2];
					
					// retrieve any content we're already saving for this page
					var pageArgs = postArgs[pagePath];
					
					// okay, not saving anything else for this item at the moment
					if (pageArgs == null) {
						pageArgs = {};
					}

					// need to strip chars here, for some reason it gets horribly munged
					var cleanedContent = instances[i].getContent().replace(/\[sitetree_link%20id=/g, "[sitetree_link id=");
					pageArgs[pageElement] = cleanedContent;
					pageArgs["ID"] = pageId;
					postArgs[pagePath] = pageArgs;
				}

				var postData = $.toJSON(postArgs);
				$.post($this.options.saveUrl, {data: postData, ajax: true}, function () {
					$this.message("Saved ");
				});
				
			} else { 
				$this.message("Failed to save");
			}
		},
		
		/**
		 * Display a message for the user
		 */
		message: function (text) {
			if ($.jGrowl) {
				$.jGrowl(text);
			} else {
				alert(text);
			}
		},
		
		/**
		 * Register plugins for the page. Later down the track we'll 
		 * have a hook so users can define their own...
		 */
		registerPlugins: function () {
			var ssSaveOptions = {
				buttons : {
					'sssave' : {name : __('Save this content'), type : 'ssEditorSaveButton'}
				}
			};
			
			var $this = this;
			
			window.ssEditorSaveButton = nicEditorButton.extend({
				mouseClick : function() {
					$this.saveContents();
				},
				disable : function(ins,t) {		
					this.updateState();	
				}
			});

			nicEditors.registerPlugin(nicPlugin, ssSaveOptions);



//				commitLink.click(function() {
//					var instances = $this.getEditorInstances();
//					// commit all changed items (but only once)
//					var committed = new Array();
//					for (var i = 0, c = instances.length; i < c; i++) {
//						elemParams = $(instances[i].elm).attr("id").split("|");
//						var pagePath = elemParams[0];
//						// only want to commit a page ONCE
//						if ($.inArray(pagePath, committed) < 0) {
//							committed.push(pagePath);
//							$.post($this.options.commitUrl, {url: pagePath}, function () {
//								$this.message("Committed all changes");
//								// now reload, because we no longer have the lock on this page
//								var join = location.href.indexOf("?") > 0 ? "&" : "?";
//								location.href = location.href + join + "stage=Live";
//							});
//						}
//					}
//				});
		}
	};
})(jQuery);