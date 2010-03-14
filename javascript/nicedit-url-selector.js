
(function ($) {
	window.ssauUrlTree = null;

	window.ssauLinkOptions = {
		buttons : {
			'insertlink' : {name : 'Insert Link', type : 'ssauLinkButton', tags : ['A']}
		}
	};

	window.ssauLinkButton = nicEditorAdvancedButton.extend({
		addPane : function() {
			var $this = this;
			this.nodeType = 'SiteTree';
			this.treeId = 'ssau' + this.nodeType + 'Tree';

			this.ln = this.ne.selectedInstance.selElm().parentTag('A');

			var treeDiv = new bkElement('DIV')
			  .setStyle({
				width     : '280px',
				height    : '300px',
				display	  : 'none',
				overflow  : 'auto',
				'float'   : 'right'
			  })
			.appendTo(this.pane.pane);
			// .setContent('<div id="'+$this.treeId+'"></div>');

			var controlsDiv = $('<div></div>').css({
				width: '200px',
				height: '300px',
				'margin-right': '300px'
			}).appendTo(this.pane.pane);

			var form = new bkElement('form').addEvent('submit',this.submit.closureListener(this));
			form.setContent(
				'<div><input type="radio" id="linkOtherSite" name="linkType" checked="checked" value="other" /><label for="linkOtherSite">Link to a page on another site</label></div>' +
				'<div style="margin-bottom: 20px;"><input type="radio" name="linkType" id="linkThisSite" value="here" /><label for="linkThisSite">Link to a page on this site</label></div>' +
				'<div id="externalPageLink"><label>URL</label><input type="text" name="href" value="http://" /><input type="hidden" name="internalhref" /></div>' +
				'<div><label>The text for this link</label><input type="text" name="linkText" /></div>' +
				'<div><label>The tooltip for this link</label><input type="text" name="linkTitle" /></div>' +
				'<div><label>Where should this link open?</label><select name="target"><option value="_top">This window</option><option value="_blank">A new window</option></select></div>' +
				'<div style="margin-top: 20px;"><input type="submit" value="Save" /><input type="button" value="Cancel" id="cancelButton" /></div>'
			);
			controlsDiv.append(form);

			var formControls = controlsDiv;
			this.theFormControls = formControls;

			$('#cancelButton').click(function () {
				$this.removePane();
			})

			$('#linkThisSite').click(function () {
				$(treeDiv).show();
				formControls.find('#externalPageLink').hide();
			})

			$('#linkOtherSite').click(function () {
				$(treeDiv).hide();
				$('#externalPageLink').show();
			})

			this.pane.pane.setStyle({width: '520px'})

			var treeContainer = $('<div id="urlSelectorTree"></div>').appendTo(treeDiv);

			treeContainer.tree({
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
							var internalHref = $('[name=internalhref]');
							var internalHrefVal = internalHref.val();
							internalHref.val('[sitetree_link id=' + bits[1] + ']');
							var linkTitle = $('[name=linkTitle]');
							var linkTitleVal = linkTitle.val();
							var nodeTitle = node.getAttribute('title');
							linkTitle.val(node.getAttribute('title'));
							var linkTitle = $('[name=linkTitle]');
							if (linkTitle != null) {
								
							}
						}
					},
					onsearch: function (nodes, tree) {
						// by default, jstree looks for the ID that was searched on, which in our case isn't
						// what is actually there. Lets convert it eh?
						// "a:contains('[sitetree_link id=8]')"
						var selectedId = nodes.selector.replace(/.+=(\d+).+/, 'SiteTree-$1');
						window.ssauUrlTree.scroll_into_view('#'+selectedId);
					}
				}
			});

			window.ssauUrlTree = $.tree.reference(treeContainer);

			// Now initialise the initial state of the form controls... 
			if (this.ln) {
				// see if we've got a sitetree_link type URL or otherwise
				var curLink = this.ln.getAttribute('href');
				if (curLink.indexOf('[') == 0) {
					$('[name=internalhref]').val(this.ln.getAttribute('href'));
					$('#linkThisSite').click();
					// now search so that we expand to the current selection
					var href = this.ln.getAttribute('href');
					setTimeout(function () {
						// need a timeout to ensure the page has enough time to initialise before we try anything
						// funky
						window.ssauUrlTree.search(href);
					}, 500);
				} else {
					$('[name=href]').val(this.ln.getAttribute('href'));
				}

				$('[name=linkTitle]').val(this.ln.getAttribute('title'));
				$('[name=linkText]').val(this.ln.innerHTML);
				$('[name=target]').val(this.ln.getAttribute('target'));
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
						if (curSel.textContent != '') {
							curSel = curSel.textContent;
						} else {
							// use the raw html of whatever nodes we have
							curSel = $('<div>').append($(curSel.childNodes[0]).clone()).html();
						}
					}
					$('[name=linkText]').val(curSel);
				}
			}
		},

		removePane : function() {
			if(this.pane) {
				this.pane.remove();
				this.pane = null;
				this.ne.selectedInstance.restoreRng();
			}
			if (window.ssauUrlTree) {
				window.ssauUrlTree.destroy();
				window.ssauUrlTree = null;
			}
		},

		submit : function(e) {
			var url = $('input[name=linkType]:checked').val() == 'other' ? $('[name=href]').val() : $('[name=internalhref]').val();

			var linkText = $('[name=linkText]').val();
			var linkTitle = $('[name=linkTitle]').val();
			var linkTarget = $('[name=target]').val();

			if(url == "http://" || url == "") {
				alert("You must enter a URL to Create a Link");
				e.preventDefault();
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
					title : linkTitle,
					target : linkTarget
				});

				this.ln.innerHTML = linkText;
			}
			
		}
	});

	nicEditors.registerPlugin(nicPlugin,ssauLinkOptions);
})(jQuery);
