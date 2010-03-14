
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
			
			$this.registerPlugins();

			var firstChild = $('body').children()[0];
			
			if (firstChild != null) {
				var toolboxBuffer = $("<div id='__toolbox-buffer' style=''></div>").prependTo($('body'));
				var toolbox = $("<div id='__toolbox'></div>").prependTo($('body'));
				toolbox.append("<img id='__ajax-load' src='frontend-editing/javascript/ajax-loader.gif' /><div id='__message-box'></div>");
				toolbox.append("<div id='__toolboxcontent'><div id='__editor-panel' ></div></div>");

				var toolboxControl = $("<div id='__toolbox-control'></div>").appendTo(toolbox);
				
				var toolboxOpener = $("<div id='__toolbox-opener'>Show Editor</div>").prependTo($('body'));

				toolboxControl.click(
					function() {
						toolbox.hide();
						toolboxBuffer.hide();
						toolboxOpener.show();

						// remove all editor bits and pieces
						var nicInstances = $this.getEditorInstances();
						for (var i = 0; i < nicInstances.length; i++) {
							nicInstances[i].remove();
						}
						$('#__editor-panel').html("");
						// reset the global cache of editors
						nicEditors.editors = [];
						
						if (autoSaveTimer != null) {
							clearInterval(autoSaveTimer);
						}
					}
				);

				// "<a href='"+BASE_URL+"'>View Live</a>&nbsp;/&nbsp;<a href='javascript: void(0);' id='__commit-all'>Commit Changes</a>";
				var toolboxActions = $('#__toolbox-actions');
				var commitLink = $("<a href='javascript: void(0);'>Publish</a>").appendTo(toolboxActions);
				$("<span>&nbsp;/&nbsp;</span>").appendTo(toolboxActions);
				var createLink = $("<a href='javascript: void(0);'>Add New Page</a>").appendTo(toolboxActions);
				
				commitLink.click(function() {
					var instances = $this.getEditorInstances();
					// commit all changed items (but only once)
					var committed = new Array();
					for (var i = 0, c = instances.length; i < c; i++) {
						elemParams = $(instances[i].elm).attr("id").split("|");
						var pagePath = elemParams[0];
						// only want to commit a page ONCE 
						if ($.inArray(pagePath, committed) < 0) {
							committed.push(pagePath);
							$.post($this.options.commitUrl, {url: pagePath}, function () {
								$this.message("Committed all changes");
								// now reload, because we no longer have the lock on this page
								var join = location.href.indexOf("?") > 0 ? "&" : "?";
								location.href = location.href + join + "stage=Live";
							});
						}
					}
				});

				toolboxOpener.click(
					function() {
						$this.convertEditableRegions();

						toolbox.show();
						toolboxBuffer.show();
						toolboxOpener.hide();
						
						// auto save every 3 minutes
						var autoSaveTimer = setInterval(function () {
							// autosave!
						}, 180000);
					}
				);
				
				toolboxOpener.click();
				
				$('#__ajax-load').ajaxStart(function() { jQuery(this).show(); });
				$('#__ajax-load').ajaxStop(function() { jQuery(this).hide(); });
			}
		},
		
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
			nicEditors.registerPlugin(nicPlugin,tableOptions);
		}
	};
})(jQuery);


/*
var urlSelectorOptions = {
	buttons : {
		'urlsel' : {name : 'Select Link', type : 'urlSelector', tags : ['A']}
	}
}

var urlSelector = nicEditorAdvancedButton.extend({
	width: '600px',

	addForm : function(f,elm) {
		this.form = new bkElement('form').addEvent('submit',this.submit.closureListener(this));
		this.pane.append(this.form);
		this.inputs = {};

		jQuery("#__tree-container").show();
		var contain = new bkElement('div').appendTo(this.form);
		
		jQuery(contain).append(jQuery('#__tree-container'));
		
		var domain = location.protocol + "//" + location.host;
		var imgUrl = elm.href; // .replace(domain, "");
		if (imgUrl != null) {
			imgUrl = imgUrl.replace(domain, "");
		} else {
			imgUrl = "";
		}

		this.inputs['href'] = new bkElement('input').setAttributes({'id': '__tree-selection', 'value' : imgUrl, 'type' : 'text'}).setStyle({margin : '2px 0', fontSize : '13px', 'float' : 'left', height : '20px', border : '1px solid #ccc', overflow : 'hidden'}).appendTo(contain);

		new bkElement('input').setAttributes({'type' : 'submit'}).setStyle({backgroundColor : '#efefef',border : '1px solid #ccc', margin : '3px 0', 'float' : 'left', 'clear' : 'both'}).appendTo(this.form);
		this.form.onsubmit = bkLib.cancelEvent;	
	},

	addPane : function() {
		this.im = this.ne.selectedInstance.selElm().parentTag('A');
		jQuery('body').append('<div id="__tree-container"><ul id="__content-tree"></ul></div>');

		// create the tree
		var tree = jQuery('#__content-tree');
		contentTree = tree.treeview ({
			url: TREE_URL+"?storeName="+STORE_NAME
		});

		
		this.addForm({}, this.im);
	},

	submit : function(e) {
		var href = this.inputs['href'].value;
		if(href == "" || href == "http://") {
			showMessage("You must enter a URL to insert");
			return false;
		}

		this.removePane();

		if(!this.im) {
			var tmp = 'javascript:nicTemp();';
			this.ne.nicCommand("createlink",tmp);
			this.im = this.findElm('A','href',tmp);
		}
		if(this.im) {
			this.im.setAttributes({
				href : this.inputs['href'].value,
			});
		}
	}
});

nicEditors.registerPlugin(nicPlugin,urlSelectorOptions);

var imageSelectorOptions = {
	buttons : {
		'imgsel' : {name : 'Select Image', type : 'imageSelector', tags : ['IMG']}
	},
};

var imageSelector = nicEditorAdvancedButton.extend({
	width: '600px',
	
	addForm : function(f,elm) {
		this.form = new bkElement('form').addEvent('submit',this.submit.closureListener(this));
		this.pane.append(this.form);
		this.inputs = {};

		jQuery("#__tree-container").show();
		var contain = new bkElement('div').appendTo(this.form);
		
		jQuery(contain).append(jQuery('#__tree-container'));
		
		var domain = location.protocol + "//" + location.host;
		var imgUrl = elm.src; // .replace(domain, "");
		if (imgUrl != null) {
			imgUrl = imgUrl.replace(domain, "");
		} else {
			imgUrl = "";
		}

		this.inputs['src'] = new bkElement('input').setAttributes({'id': '__tree-selection', 'value' : imgUrl, 'type' : 'text'}).setStyle({margin : '2px 0', fontSize : '13px', 'float' : 'left', height : '20px', border : '1px solid #ccc', overflow : 'hidden'}).appendTo(contain);

		new bkElement('input').setAttributes({'type' : 'submit'}).setStyle({backgroundColor : '#efefef',border : '1px solid #ccc', margin : '3px 0', 'float' : 'left', 'clear' : 'both'}).appendTo(this.form);
		this.form.onsubmit = bkLib.cancelEvent;	
	},

	addPane : function() {
		this.im = this.ne.selectedInstance.selElm().parentTag('IMG');
		jQuery('body').append('<div id="__tree-container"><ul id="__content-tree"></ul></div>');
		// create the tree
		var tree = jQuery('#__content-tree');
		contentTree = tree.treeview ({
			url: TREE_URL+"?storeName="+STORE_NAME
		});

		
		this.addForm({}, this.im);
	},

	submit : function(e) {
		var src = this.inputs['src'].value;
		if(src == "" || src == "http://") {
			showMessage("You must enter a Image URL to insert");
			return false;
		}

		this.removePane();

		if(!this.im) {
			var tmp = 'javascript:nicImTemp();';
			this.ne.nicCommand("insertImage",tmp);
			this.im = this.findElm('IMG','src',tmp);
		}
		if(this.im) {
			this.im.setAttributes({
				src : this.inputs['src'].value,
			});
		}
	}
});

nicEditors.registerPlugin(nicPlugin,imageSelectorOptions);
*/
function treeNodeClicked(val)
{
	// fill in the __tree-selection field
	var $this = this;
	var bits = val.split('|');
	jQuery('#__tree-selection').val(bits[2] + "?" + bits[1]);
}