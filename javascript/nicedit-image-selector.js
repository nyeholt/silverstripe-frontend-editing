
(function ($) {

	window.ssauImageTree = null;

	window.ssauImageOptions = {
		buttons : {
			'insertimage' : {name : 'Insert Image', type : 'ssauImageButton', tags : ['IMG']}
		}
	};

	window.ssauImageButton = nicEditorAdvancedButton.extend({
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

			var form = new bkElement('form').addEvent('submit',this.submit.closureListener(this));
			form.setContent(
				'<div><label>URL</label><input type="text" name="href" value="http://" /></div>' +
				'<div><label>Alternate Text</label><input type="text" name="altText" value="" /></div>' +
				'<div><label>The tooltip for this image</label><input type="text" name="title" /></div>' +
				'<div style="margin-top: 20px;"><input type="submit" value="Save" /><input type="button" value="Cancel" class="cancelButton" /></div>'
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
						url : SILVERSTRIPE_BASE + '__tree/childnodes/File/Image'
					}
				},
				ui: {
					theme_name: 'default'
				},
				callback: {
					onselect: function (node, tree) {
						var bits = node.id.split('-');
						if (bits[1]) {
							$('[name=href]').val(node.getAttribute('link'));
							$('[name=title]').val(node.getAttribute('title'));
						}
					}
				}
			});

			window.ssauImageTree = $.tree.reference(treeContainer);

			// Now initialise the initial state of the form controls... 
			if (this.ln) {
				// see if we've got a sitetree_link type URL or otherwise
				var curLink = this.ln.getAttribute('src');
				if (curLink.indexOf('assets/') === 0) {
					$('[name=internalhref]').val(this.ln.getAttribute('src'));
					// now search so that we expand to the current selection
					setTimeout(function () {
						// need a timeout to ensure the page has enough time to initialise before we try anything
						// funky
						ssauImageTree.search(curLink);
					}, 500);
				} else {
					$('[name=href]').val(this.ln.getAttribute('href'));
				}

				$('[name=title]').val(this.ln.getAttribute('title'));
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
			if (window.ssauImageTree) {
				window.ssauImageTree.destroy();
				window.ssauImageTree = null;
			}
		},

		submit : function(e) {
			var formControls = $('#imageSelectionControls');
			var url = $('[name=href]').val();
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
					title : $('[name=title]').val()
				});
			}
			e.preventDefault();
			return false;
		}
	});

	nicEditors.registerPlugin(nicPlugin,ssauImageOptions);
})(jQuery);
