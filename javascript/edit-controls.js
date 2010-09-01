(function($){
	function cleanUrl() {
		var cur = location.href;
		cur = cur.replace(/&stage=[a-zA-Z]+/g, '');
		cur = cur.replace(/\?stage=[a-zA-Z]+/g, '');
		cur = cur.replace(/&startEditing=true/g, '');
		return cur;
	}

	$().ready(function () {
		$('#FE_ViewPublished').click(function () {
			var cur = cleanUrl();
			var sep = cur.indexOf('?') > 0 ? '&' : '?';
			location.href = cur + sep + 'stage=Live';
		})
	});

	$().ready(function () {
		$('#FE_EditDraft').click(function () {
			var cur = cleanUrl();
			var sep = cur.indexOf('?') > 0 ? '&' : '?';
			location.href = cur + sep + 'stage=Stage&startEditing=true';
		})
	});


})(jQuery);