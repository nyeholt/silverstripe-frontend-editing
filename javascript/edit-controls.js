(function($){
	function cleanPath(cur) {
		cur = cur.replace(/&stage=[a-zA-Z]+/g, '');
		cur = cur.replace(/\?stage=[a-zA-Z]+/g, '');
		cur = cur.replace(/&startEditing=true/g, '');
		return cur;
	}

	$().ready(function () {
		
		var editorTimeout = null;
		
		$('#EditControlsDetector').hover(function () {
			$('#FrontendEditingControls').show();
			clearTimeout(editorTimeout);
		}, function () {
			editorTimeout = setTimeout(function () { $('#FrontendEditingControls').hide(); }, 5000);
		});
		
		$('#FE_ViewPublished').click(function () {
			var newUrl = location.protocol + '//' + location.hostname + location.pathname;
			var cur = cleanPath(location.search);
			var sep = cur.indexOf('?') > 0 ? '&' : '?';
			cur = cur + sep + 'stage=Live';
			
			cur += location.hash;
			
			location.href = newUrl + cur;
		})

		$('#FE_EditDraft').click(function () {
			
			var newUrl = location.protocol + '//' + location.hostname + location.pathname;
			var cur = cleanPath(location.search);
			var sep = cur.indexOf('?') > 0 ? '&' : '?';
			cur = cur + sep + 'stage=Stage&startEditing=true';
			
			cur += location.hash;
			
			location.href = newUrl + cur;
		})
	});
})(jQuery);