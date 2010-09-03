
(function ($) {
	// global reference for the tree
	var ssauImageTree = null;

	var TREE_URL = '__tree/childnodes/File/Image';

	SSFrontendEditor.Instance.registerPlugin({
		addButtonsTo: function (buttonList) {

		},
		load: function (editors) {

			var _this = this;

			var ssauImageOptions = {
				buttons : {
					'insertimage' : {name : 'Insert Image', type : 'SSFrontendEditor.ssauImageButton', tags : ['IMG']}
				}
			};
			SSFrontendEditor.ssauImageButton = nicEditorAdvancedButton.extend({
				addPane : function() {
					var $this = this;
					this.nodeType = 'File';
					this.treeId = 'ssau' + this.nodeType + 'Tree';

					this.ln = this.ne.selectedInstance.selElm().parentTag('IMG');

					var treeDiv = new bkElement('DIV')
					  .setStyle({
						width     : '280px',
						height    : '300px',
						overflow  : 'auto',
						'float'   : 'right'
					  })
					.appendTo(this.pane.pane);

					// .setContent('<div id="'+this.treeId+'"></div>');

					var controlsDiv = $('<div></div>').css({
						width: '200px',
						height: '300px',
						'margin-right': '300px'
					}).appendTo(this.pane.pane);

					// need to delete any that are left around - due to the way nicedit does its stuff
					$('.imageListDiv').remove();

					var imageListDiv = $('<div class="imageListDiv"></div>').css({
						clear: 'both',
						width: '510px',
						overflow: 'auto'
					}).appendTo(this.pane.pane);

					var form = new bkElement('form').addEvent('submit',this.submit.closureListener(this));
					form.setContent(
						'<div><label>URL</label><input type="text" name="href" value="http://" /></div>' +
						'<div><label>Alternate Text</label><input type="text" name="altText" value="" /></div>' +
						'<div><label>The tooltip for this image</label><input type="text" name="title" /></div>' +
						'<div style="margin-top: 20px;"><input type="submit" value="Insert" /><input type="button" value="Cancel" class="cancelButton" /></div>'
					);

					controlsDiv.append(form);

					$('.cancelButton').click(function () {
						$this.removePane();
					})
					
					this.pane.pane.setStyle({width: '520px'});

					var treeContainer = $('<div id="imageSelectorTree"></div>').appendTo(treeDiv);
					treeContainer.tree({
						data : {
							type : "json",
							async: true,
							opts : {
								async: true,
								url : TREE_URL
							}
						},
						ui: {
							theme_name: 'default'
						},
						callback: {
							onselect: function (node, tree) {
								var bits = node.id.split('-');
								if (bits[1] && bits[0] != 'Folder') {
									$('[name=href]').val(node.getAttribute('link'));
									$('[name=title]').val(node.getAttribute('title'));
								} else {
									// lets load all the children of the folder in a list
									_this.loadPreviewImages($('.imageListDiv'), node.id)
								}
							}
						}
					});

					ssauImageTree = $.tree.reference(treeContainer);

					// Now initialise the initial state of the form controls...
					if (this.ln) {
						// see if we've got a sitetree_link type URL or otherwise
						var curLink = this.ln.getAttribute('src');
						if (curLink.indexOf('assets/') === 0) {
							controlsDiv.find('[name=href]').val(curLink);
							// now search so that we expand to the current selection
							setTimeout(function () {
								// need a timeout to ensure the page has enough time to initialise before we try anything
								// funky
								ssauImageTree.search(curLink);
							}, 500);
						} else {
							controlsDiv.find('[name=href]').val(this.ln.getAttribute('href'));
						}
						var title = this.ln.getAttribute('title');
						controlsDiv.find('[name=title]').val(this.ln.getAttribute('title'));
					} else if (this.ne.selectedInstance.selElm()) {
						// see if there's a text selection at all
					}

				},

				removePane : function() {
					if(this.pane) {
						this.pane.remove();
						this.pane = null;
						this.ne.selectedInstance.restoreRng();
					}
					if (ssauImageTree) {
						ssauImageTree.destroy();
						ssauImageTree = null;
					}
				},

				submit : function(e) {
					var formControls = $('#imageSelectionControls');
					var url = $('[name=href]').val();
					// store before we exit...
					var elemTitle = $('[name=title]').val();

					if(url == "http://" || url == "") {
						alert("You must enter a URL to Create a Link");
						return false;
					}

					this.removePane();

					if(!this.ln) {
						var tmp = 'javascript:nicImTemp();';
						this.ne.nicCommand("insertImage",tmp);
						this.ln = this.findElm('IMG','src',tmp);
					}
					if(this.ln) {

						this.ln.setAttributes({
							src : url,
							title : elemTitle
						});
					}
					e.preventDefault();
					return false;
				}
			});
			editors.registerPlugin(nicPlugin,ssauImageOptions);
		},
		loadPreviewImages: function (targetDiv, folderId) {
			targetDiv.empty();
			var list = $('<ul>').appendTo(targetDiv).css({
				height: '140px',
				padding: '8px',
				cursor: 'pointer',
				'list-style-type': 'none'
			});

			$.get(TREE_URL, {id: folderId}, function (data) {
				var objects = $.parseJSON(data);
				if (objects && objects.length) {
					list.css('width', "" + (objects.length * 138 + 16) + 'px');
					for (var i = 0; i < objects.length; i++) {
						var obj = objects[i];
						if (obj.thumbs) {
							var li = $('<li>').appendTo(list);
							li.html('<img src="'+obj.thumbs.x128+'" title="'+obj.attributes.title+'" alt="'+obj.attributes.link+'" />');
							li.css({
								'float': 'left',
								'margin': '5px'
							});

							li.click(function () {
								$('[name=href]').val($(this).find('img').attr('alt'));
								$('[name=title]').val($(this).find('img').attr('title'));
							})
						}
					}
				}
			});
		}
	});
	
})(jQuery);
