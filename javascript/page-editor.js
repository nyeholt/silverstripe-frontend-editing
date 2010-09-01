
var SSFrontendEditor = {};

(function($) {
	SSFrontendEditor.FrontendEditor = function (options) {
		if (SSFrontendEditor.Instance != null) {
			throw "Can only create a single instance of the frontend editor.";
		}

		SSFrontendEditor.Instance = this;
		this.options = options;

		this.wysiwygElements = options.editorClass || "__wysiwyg-editable";
		this.pageEditor = null;

		this.nicInstances = [];
		this.plugins = [];
		
		// we wait 500ms until other bits of code have run in jquery's ready(), so that 
		// they can register plugins etc if they wish
		setTimeout(function () {
			SSFrontendEditor.Instance.init();
		}, 500);
	};

	SSFrontendEditor.FrontendEditor.prototype = {
		init: function () {
			this.contentChanged = false;
			this.initialiseToolbars();
		},

		/**
		 * Register a plugin to be loaded into the editor
		 */
		registerPlugin: function (plugin) {
			this.plugins.push(plugin);
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
			dialogMask.css({'width':maskWidth,'height':maskHeight, opacity: '0.8'});
			dialogMask.show();
		},
		
		clearMask: function () {
			$('#__editor-mask').hide();
			this.statusDiv().hide();
		},

		/**
		 *  retrieve the status div
		 */
		statusDiv: function () {
			var statusDiv = $('.__editorLoadStatus');
			if (!statusDiv.length) {
				statusDiv = $('<div class="__editorLoadStatus">').appendTo('body');
			}
			statusDiv.show();
			return statusDiv;
		},

		/**
		 * Initialise the toolbars used by the editor
		 */
		initialiseToolbars: function () {
			var $this = this;
			var autoSaveTimer = null;

			var firstChild = $('body').children()[0];

			if (firstChild != null) {
				var toolboxBuffer = $("<div id='__toolbox-buffer' style=''></div>").prependTo($('body'));
				var toolbox = $("<div id='__toolbox'></div>").prependTo($('body'));
				toolbox.append("<img id='__ajax-load' src='frontend-editing/javascript/ajax-loader.gif' /><div id='__message-box'></div>");
				toolbox.append("<div id='__toolboxcontent'><div id='__editor-panel' ></div></div>");

				var toolboxCloser = $('#FE_SwitchOff');
				if (toolboxCloser.length == 0) {
					toolboxCloser = $("<div id='__toolbox-control'></div>").appendTo(toolbox);
				}

				var toolboxOpener = $('#FE_SwitchOn').show();
				if (toolboxOpener.length == 0) {
					toolboxOpener = $("<div id='__toolbox-opener'>Show Editor</div>").prependTo($('body'));
				}

				// when closing
				toolboxCloser.click(
					function() {
						if ($this.contentChanged && !confirm("Any changes made will be lost. Are you sure?")) {
							return false;
						}

						$this.maskScreen();
						toolbox.hide();
						toolboxBuffer.hide();
						toolboxCloser.hide();
						toolboxOpener.show();

						// we rely on this method to clear the mask!
						$this.unconvertEditableRegions();

						if (autoSaveTimer != null) {
							clearInterval(autoSaveTimer);
						}

						return false;
					}
				);

				// when opening
				toolboxOpener.click(
					function() {
						$this.maskScreen();

						// we rely on this to clear the mask when finished!!
						$this.convertEditableRegions();

						toolbox.show();
						toolboxBuffer.show();
						toolboxOpener.hide();
						toolboxCloser.show();

						// auto save every 3 minutes
						autoSaveTimer = setInterval(function () {
							// autosave!
						}, 180000);
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
			this.contentChanged = false;

			var buttons = ['bold','italic','underline','left','center',
	       		'right','justify','ol','ul','fontFormat', 'removeformat',
	       		'indent','outdent','insertlink','unlink','insertimage', 'forecolor',
	       		'bgcolor','xhtml', 'table'];
	       	var icons = {"xhtml":1,"bgcolor":2,"forecolor":3,"bold":4,"center":5,
	       		"hr":6,"indent":7,"italic":8,"justify":9,"left":10,"ol":11,"outdent":12,
	       		"removeformat":13,"right":14,"strikethrough":16,"subscript":17,
	       		"superscript":18,"ul":19,"underline":20,"image":21,"insertimage":21,"link":22,"unlink":23,
	       		"close":24,"arrow":26,"insertlink": 22}

			for (var i = 0, c = this.plugins.length; i < c; i++) {
				// first call its load method, passing the global nicEditors object to have plugins loaded into it
				this.plugins[i].load(nicEditors);

				// then update the buttons list
				this.plugins[i].addButtonsTo(buttons);
			}

	       	var $this = this;
	       	this.pageEditor = new nicEditor({buttonList: buttons, iconList: icons, iconsPath: 'frontend-editing/javascript/nicEditorIcons.gif'});
	       	this.pageEditor.setPanel('__editor-panel');
			
			var elementsToConvert = $('.'+$this.wysiwygElements);

			$this.statusDiv().html('<p>Loading 0%</p>');

			var numToConvert = elementsToConvert.length;
			var numberConverted = 0;

	       	elementsToConvert.each(function (index) {
				$this.pageEditor.addInstance(this);
				var elemParams = $(this).attr("id").split("|");
				var typeInfo = elemParams[0] + '-' + elemParams[2];

				$(this).addClass('__editable');

				// it's safe to bind now, because updateFieldContents processes syncronously
				$(this).click(function () {
					$this.contentChanged = true;
				});
				$(this).keydown(function () {
					$this.contentChanged = true;
				})

				$this.updateFieldContents(this, typeInfo, 'raw',
					function () {
						numberConverted++;
						$this.statusDiv().html('<p>Loading ' + (((numberConverted) / numToConvert) * 100).toFixed(2) + '%</p>');
						if (numberConverted >= numToConvert) {
							// delay the clearing of the mask - makes sure that everything has inited and stuff...
							// It's also somewhat deliberate so that users have a moment to register that yes, there's something
							// completely different about the interface now
							setTimeout(function () {
								$this.clearMask();
							}, 500);

						}
					},
					function () {
						$this.unconvertEditableRegions();
					}
				);
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

			var elementsToConvert = $('.'+$this.wysiwygElements);
			$this.statusDiv().html('<p>Loading 0%</p>');

			var numToConvert = elementsToConvert.length;
			var numberConverted = 0;
			
			elementsToConvert.each(function (index) {
				var elemParams = $(this).attr("id").split("|");
				var typeInfo = elemParams[0] + '-' + elemParams[2];
				$(this).removeClass('__editable');

				$this.updateFieldContents(this, typeInfo, 'escaped',
					function () {
						numberConverted++;
						$this.statusDiv().html('<p>Loading ' + (((numberConverted) / numToConvert) * 100).toFixed(2) + '%</p>');
						if (numberConverted >= numToConvert) {
							// delay the clearing of the mask - makes sure that everything has inited and stuff...
							// It's also somewhat deliberate so that users have a moment to register that yes, there's something
							// completely different about the interface now
							setTimeout(function () {
								$this.clearMask();
							}, 500);

						}
					},
					function () {
						$this.unconvertEditableRegions();
					}
				);
	       	});
		},

		/**
		 * Switches field contents from being display ready to edit ready
		 * This is done because silverstripe will sometimes pre-process content that gets displayed
		 *
		 * We do this synchronously so that users never edit content before it's fully loaded and ready
		 * to be changed
		 */
		updateFieldContents: function (element, typeInfo, format, successfulLoad, loadError) {
			var $this = this;
			var request = $this.options.contentUrl + '/' + typeInfo + '/' + format;
			$.ajax({
				async: true,
				url: request,
				success: function (data) {
					var response = $.parseJSON(data);
					if (!response.success) {
						alert("There was an error initialising the data for " + typeInfo);
					} else {
						$(element).html(response.data);
						$(element).removeClass('__editable_empty');
						if (response.data == null) {
							$(element).addClass('__editable_empty');
						}
					}
					successfulLoad.apply($this);
				},
				error: function () {
					loadError.apply($this);
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

		/**
		 * Save the contents of the current page, into whichever objects are relevant
		 */
		saveContents: function (content, id, selectedInstances) {
			var $this = this;
			var instances = this.getEditorInstances();
			// get all the editors and package them up for saving
			var postArgs = {};

			if (instances.length > 0) {
				for (var i = 0, c = instances.length; i < c; i++) {
					var elemParams = $(instances[i].elm).attr("id").split("|");
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
				$.post($this.options.saveUrl, {data: postData, ajax: true}, function (data) {
					var response = $.parseJSON(data);
					if (response.success) {
						$this.message(response.message);
						$this.contentChanged = false;
					} else {
						$this.message(response.message);
					}
				});
			} else { 
				$this.message("Failed to save");
			}
		},

		/**
		 * Publish all content that's editable
		 */
		publishContent: function () {
			var $this = this;

			if ($this.contentChanged) {
				if (!confirm("Any changes made will be lost, click cancel, save changes, and try again, or OK to publish anyway")) {
					return;
				}
			}

			var instances = this.getEditorInstances();
			// get all the editors and package them up for saving
			var postArgs = {};
			var toPublish = {};
			if (instances.length > 0) {
				for (var i = 0, c = instances.length; i < c; i++) {
					var elemParams = $(instances[i].elm).attr("id").split("|");
					var typeInfo = elemParams[0];
					var pageId = elemParams[1];
					toPublish[typeInfo] = pageId;
				}

				postArgs.toPublish = toPublish;

				var postData = $.toJSON(postArgs);
				$.post($this.options.commitUrl, {data: postData, ajax: true}, function (data) {
					var response = $.parseJSON(data);
					if (response.success) {
						$this.message(response.message);
						$('#FE_ViewPublished').click();
					} else {
						$this.message(response.message);
					}
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
		}
	};

	SSFrontendEditor.Plugin = function () {
	}

	SSFrontendEditor.Plugin.prototype = {
		addButtonsTo: function (buttonList) {},
		load: function (editors) {}
	}

	new SSFrontendEditor.FrontendEditor({saveUrl: "frontendedit/frontendSave", commitUrl: "frontendedit/frontendCommit", contentUrl: "frontendedit/getcontent"});

	SSFrontendEditor.Instance.registerPlugin({
		addButtonsTo: function (buttonList) {
			buttonList.unshift('sspublish');
			buttonList.unshift('sssave');
		},
		
		load: function (editors) {
			SSFrontendEditor.ssEditorSaveButton = nicEditorButton.extend({
				mouseClick : function() {
					SSFrontendEditor.Instance.saveContents();
				},
				disable : function(ins,t) {
					this.updateState();
				}
			});

			SSFrontendEditor.ssEditorPublish = nicEditorButton.extend({
				mouseClick: function () {
					SSFrontendEditor.Instance.publishContent();
				},
				disable: function (ins,t) {
					this.updateState();
				}
			});

			$(document).keydown(function (e) {
				// alt + s
				if (e.altKey && e.which == 83) {
					SSFrontendEditor.Instance.saveContents();
					e.preventDefault();
					return false;
				}
			})

			var ssSaveOptions = {
				buttons : {
					'sssave' : {name : __('Save this content'), type : 'SSFrontendEditor.ssEditorSaveButton'},
					'sspublish' : {name: __('Publish this content'), type: 'SSFrontendEditor.ssEditorPublish'}
				},
				iconFiles : {
					'sspublish' : 'frontend-editing/javascript/tick.png',
					'sssave' : 'frontend-editing/javascript/save.png'
				}
			};

			editors.registerPlugin(nicPlugin, ssSaveOptions);
		}
	});

})(jQuery);