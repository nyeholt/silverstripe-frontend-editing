
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
				'<div><label>Link to a page on another site</label><input type="text" name="href" value="http://" /><input type="hidden" name="internalhref" /></div>' +
				'<div><label>The title to use for this link</label><input type="text" name="title" /></div>' +
				'<div><label>Where should this link open?</label><select name="target"><option value="_top">This window</option><option value="_blank">A new window</option></select></div>' +
				'<div><input type="submit" value="Save" /></div>'
			);
			form.appendTo(this.controlsDiv);

			if (this.ln) {
				$(this.controlsDiv).find('[name=href]').val(this.ln.getAttribute('href'));
				$(this.controlsDiv).find('[name=title]').val(this.ln.getAttribute('title'));
				$(this.controlsDiv).find('[name=target]').val(this.ln.getAttribute('target'));
			}

			this.pane.pane.setStyle({width: '520px'})

			var $this = this;
			$('#ssauLinkTree').tree({
				data : {
					type : "json",
					async: true,
					opts : {
						async: true,
						url : SILVERSTRIPE_BASE + '/__tree/childnodes'
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
							// $(this.controlsDiv).find('[name=title]').val(node.getAttribute('rel'));
						}
					}
				}
			});
		},
		submit : function(e) {
			var url = $(this.controlsDiv).find('[name=href]').val();
			var internalUrl = $(this.controlsDiv).find('[name=internalhref]').val();
			if (internalUrl && (!url.length || url == 'http://')) {
				url = internalUrl;
			}
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
			}
		}
	});

	nicEditors.registerPlugin(nicPlugin,ssauLinkOptions);
})(jQuery);
