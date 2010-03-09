
(function ($) {
	window.ssauLinkOptions = {
		buttons : {
			'insertlink' : {name : 'Insert Link', type : 'ssauLinkButton', tags : ['A']}
		}
	};

	window.ssauLinkButton = nicEditorAdvancedButton.extend({
		addPane : function() {
			this.ln = this.ne.selectedInstance.selElm().parentTag('A');
			this.addForm({
				'' : {type : 'title', txt : 'Add/Edit Link'},
				'href' : {type : 'text', txt : 'URL', value : 'http://', style : {width: '150px'}},
				'title' : {type : 'text', txt : 'Title'},
				'target' : {type : 'select', txt : 'Open In', options : {'' : 'Current Window', '_blank' : 'New Window'},style : {width : '100px'}},
				'' : {type: 'title', txt: 'OR select a page below'}
			},this.ln);

			this.pane.pane.setStyle({width: '400px'})

			var treeDiv = new bkElement('DIV')
			  .setStyle({
				width     : '98%',
				height    : '300px',
				overflow  : 'auto',
				fontWeight: 'bold'
			  })
			.appendTo(this.pane.pane)
			.setContent('<div id="ssauLinkTree"></div>');

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
				callback: {
					onselect: function (node, tree) {
						var bits = node.id.split('-');
						if (bits[1]) {
							$this.inputs['href'].value = '[sitetree_link id=' + bits[1] + ']';
						}
					}
				}
			});
		},
		submit : function(e) {
			var url = this.inputs['href'].value;
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
					href : this.inputs['href'].value,
					title : this.inputs['title'].value,
					target : this.inputs['target'].options[this.inputs['target'].selectedIndex].value
				});
			}
		}
	});

	nicEditors.registerPlugin(nicPlugin,ssauLinkOptions);
})(jQuery);
