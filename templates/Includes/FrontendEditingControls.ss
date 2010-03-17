<div id="FrontendEditingControls">
	<% if FrontendEditAllowed(butOnLiveStage)  %>
	<% if LiveSite %>
	<input type="button" value="<% _t('FrontendEdit.EDIT_DRAFT_PAGE','Edit Draft Page') %>" id="FE_EditDraft"  />
	<% else %>
	<input type="button" value="<% _t('FrontendEdit.VIEW_PUBLISHED_PAGE','View Published Page') %>" id="FE_ViewPublished"/>
	<% end_if %>
	<% end_if %>
	<% if FrontendEditAllowed %>
	<input type="button" value="<% _t('FrontendEdit.START_EDITING','Open Editor') %>" id="FE_SwitchOn"/>
	<input type="button" value="<% _t('FrontendEdit.STOP_EDITING','Close Editor') %>" id="FE_SwitchOff"/>
	<% end_if %>
</div>