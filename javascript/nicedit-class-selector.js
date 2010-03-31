
(function ($) {

	var classSelectorOptions = {
		buttons : {
			'applyclass' : {name : 'Add Class', type : 'classSelectorButton', command: 'formatBlock'}
		}
	};

	window.classSelectorButton = nicEditorSelect.extend({
		init : function() {

			this.setDisplay('Style...');
			var styles = this.getStyles()
			for(var itm in styles) {
				var className = itm.substr(1, itm.length);
				this.add(className, styles[itm]);
			}
		},

		getStyles: function () {
			if(!document.styleSheets) return false; // return false if browser sucks
			var rules = {}
			for (var i=0; i < document.styleSheets.length; i++) {
				var x = 0;
				var styleSheet = document.styleSheets[i];
				if (styleSheet) {
					// otherwise get them individually
					do {
						try {
							var cssRule = styleSheet.cssRules ? styleSheet.cssRules[x] : styleSheet.rules[x];
							if(cssRule && cssRule.selectorText && cssRule.selectorText.indexOf('.wysiwyg-') == 0) {
								rules[cssRule.selectorText] = cssRule.selectorText.replace(/.wysiwyg-/, '');
							}
						} catch (someErrorWeIgnore) {
							cssRule = null;
						}
						
						x++;
					} while (cssRule);
				}
			}
			return rules;
		},

		enable : function(t) {
			this.isDisabled = false;
			this.close();
			this.contain.setStyle({opacity : 1});

			this.selectedElem = this.ne.selectedInstance.selElm();
		},

		update : function(cls) {

			var curRange = this.ne.selectedInstance.getRng();
			if (window.getSelection) {
				var selectionContent = curRange.extractContents();
				for (var i = selectionContent.childNodes.length - 1; i >= 0; i--) {
					var tn = selectionContent.childNodes[i];
					if (tn.nodeType == 3) {
						curRange.insertNode($('<span>').addClass(cls).text(tn.nodeValue).get(0));
					} else {
						curRange.insertNode($(tn).addClass(cls).clone().get(0));
					}
				}
			} else {
				var childNodes = $('<div>').append(curRange.htmlText).get(0).childNodes;
				var pc = $('<div>');
				for (var i = 0; i < childNodes.length; i++) {
					var tn = childNodes[i];
					if (tn.nodeType == 3) {
						var newSpan = $('<span>').addClass(cls).text(tn.nodeValue);
						pc.append(newSpan);
					} else {
						var newSpan = $(tn).clone().addClass(cls);
						pc.append(newSpan);
					}
				}
				var newText = pc.html();
				curRange.pasteHTML(newText);
			}
			
			this.close();
		}
	});
	
	


	nicEditors.registerPlugin(nicPlugin,classSelectorOptions);
})(jQuery);
