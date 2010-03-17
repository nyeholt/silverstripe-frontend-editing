(function($){
	$().ready(function () {
		$('#FE_ViewPublished').click(function () {
			var sep = location.href.indexOf('?') > 0 ? '&' : '?';
			location.href = location.href + sep + 'stage=Live';
		})
	});

	$().ready(function () {
		$('#FE_EditDraft').click(function () {
			var sep = location.href.indexOf('?') > 0 ? '&' : '?';
			location.href = location.href + sep + 'stage=Stage&startEditing=true';
		})
	});
})(jQuery);