
(function ($) {
	window.ssauLinkOptions = {
		buttons : {
			'insertlink' : {name : 'Insert Link', type : 'ssauLinkButton', tags : ['A']}
		}
	};

	window.ssauLinkButton = nicEditorAdvancedButton.extend({
		addPane : function() {
			this.ln = this.ne.selectedInstance.selElm().parentTag('A');

			var treeDiv = new bkElement('DIV')
			  .setStyle({
				width     : '280px',
				height    : '300px',
				display	  : 'none',
				overflow  : 'auto',
				'float'   : 'right'
			  })
			.appendTo(this.pane.pane)
			.setContent('<div id="ssauLinkTree"></div>');

			this.controlsDiv = new bkElement('DIV')
			.setStyle({
				width: '200px',
				height: '300px',
				'margin-right': '300px'
			})
			.appendTo(this.pane.pane);

			var form = new bkElement('form').addEvent('submit',this.submit.closureListener(this));
			form.setContent(
				'<div><input type="radio" id="linkOtherSite" name="linkType" checked="checked" value="other" /><label for="linkOtherSite">Link to a page on another site</label></div>' +
				'<div style="margin-bottom: 20px;"><input type="radio" name="linkType" id="linkThisSite" value="here" /><label for="linkThisSite">Link to a page on this site</label></div>' +
				'<div id="externalPageLink"><label>URL</label><input type="text" name="href" value="http://" /><input type="hidden" name="internalhref" /></div>' +
				'<div><label>The text for this link</label><input type="text" name="linkText" /></div>' +
				'<div><label>The tooltip for this link</label><input type="text" name="title" /></div>' +
				'<div><label>Where should this link open?</label><select name="target"><option value="_top">This window</option><option value="_blank">A new window</option></select></div>' +
				'<div style="margin-top: 20px;"><input type="submit" value="Save" /><input type="button" value="Cancel" class="cancelButton" /></div>'
			);

			form.appendTo(this.controlsDiv);

			
			var $this = this;
			$(this.controlsDiv).find('.cancelButton').click(function () {
				$this.removePane();
			})

			$(this.controlsDiv).find('#linkThisSite').click(function () {
				$(treeDiv).show();
				$(this.controlsDiv).find('#externalPageLink').hide();
			})

			$(this.controlsDiv).find('#linkOtherSite').click(function () {
				$(treeDiv).hide();
				$(this.controlsDiv).find('#externalPageLink').show();
			})

			this.pane.pane.setStyle({width: '520px'})
			
			$('#ssauLinkTree').tree({
				data : {
					type : "json",
					async: true,
					opts : {
						async: true,
						url : SILVERSTRIPE_BASE + '__tree/childnodes'
					}
				},
				ui: {
					theme_name: 'default'
				},
				callback: {
					onselect: function (node, tree) {
						var bits = node.id.split('-');
						if (bits[1]) {
							$(this.controlsDiv).find('[name=internalhref]').val('[sitetree_link id=' + bits[1] + ']');
							$(this.controlsDiv).find('[name=title]').val(node.getAttribute('title'));
						}
					},
					onsearch: function (nodes, tree) {
						// by default, jstree looks for the ID that was searched on, which in our case isn't
						// what is actually there. Lets convert it eh?
						// "a:contains('[sitetree_link id=8]')"
						var selectedId = nodes.selector.replace(/.+=(\d+).+/, 'SiteTree-$1');
						$.tree.reference('#ssauLinkTree').select_branch('#'+selectedId, false);
						$.tree.reference('#ssauLinkTree').scroll_into_view('#'+selectedId);
					}
				},
				plugins: {
					cookie: { prefix: 'linktree_' }
				}
			});

			// Now initialise the initial state of the form controls... 
			if (this.ln) {
				// see if we've got a sitetree_link type URL or otherwise
				var curLink = this.ln.getAttribute('href');
				if (curLink.indexOf('[') == 0) {
					$(this.controlsDiv).find('[name=internalhref]').val(this.ln.getAttribute('href'));
					$('#linkThisSite').click();
					// now search so that we expand to the current selection
					var href = this.ln.getAttribute('href');
					setTimeout(function () {
						$.tree.reference('#ssauLinkTree').search(href);
					}, 500);
					
				} else {
					$(this.controlsDiv).find('[name=href]').val(this.ln.getAttribute('href'));
				}

				$(this.controlsDiv).find('[name=title]').val(this.ln.getAttribute('title'));
				$(this.controlsDiv).find('[name=linkText]').val(this.ln.innerHTML);
				$(this.controlsDiv).find('[name=target]').val(this.ln.getAttribute('target'));
			} else if (this.ne.selectedInstance.selElm()) {
				// see if there's a text selection at all
				var curSel = this.ne.selectedInstance.getRng();
				if (curSel) {
					// TODO - will this break in ie 7 and less? PROBABLY
					// @see http://cutesoft.net/forums/thread/58988.aspx for a possible fix...
					if (curSel.htmlText) {
						curSel = curSel.htmlText;
					} else {
						curSel = curSel.cloneContents();
						curSel = curSel.firstChild.nodeValue;
					}
					
					$(this.controlsDiv).find('[name=linkText]').val(curSel);
				}
			}

		},

		submit : function(e) {
			var url = $(this.controlsDiv).find('input[name=linkType]:checked').val() == 'other' ? $(this.controlsDiv).find('[name=href]').val() : $(this.controlsDiv).find('[name=internalhref]').val();
			if(url == "http://" || url == "") {
				alert("You must enter a URL to Create a Link");
				return false;
			}
			this.removePane();

			if(!this.ln) {
				var tmp = 'javascript:nicTemp();';
				this.ne.nicCommand("createlink",tmp);
				this.ln = this.findElm('A','href',tmp);
			}
			if(this.ln) {
				this.ln.setAttributes({
					href : url,
					title : $(this.controlsDiv).find('[name=title]').val(),
					target : $(this.controlsDiv).find('[name=target]').val()
				});

				this.ln.innerHTML = $(this.controlsDiv).find('[name=linkText]').val();
			}
		}
	});

	nicEditors.registerPlugin(nicPlugin,ssauLinkOptions);
})(jQuery);
