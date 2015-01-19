<% if $CurrentMember && $can(PERM_FRONTEND_EDIT) %>

<% if LiveSite %>
<div id='EditControlsDetector'>

</div>
<% end_if %>

<div id="FrontendEditingControls" data-islive="<% if LiveSite %>true<% end_if %>">
	
	<% if FrontendEditAllowed(0)  %>
		<% if LiveSite %>
		<input type="button" value="<% _t('FrontendEdit.EDIT_DRAFT_PAGE','Edit Draft Page') %>" id="FE_EditDraft"  />
		<% else %>
		<input type="button" value="<% _t('FrontendEdit.VIEW_PUBLISHED_PAGE','View Published Page') %>" id="FE_ViewPublished"/>
		<% end_if %>
	<% end_if %>

	<input type="button" value="<% _t('FrontendEdit.START_EDITING','Open Editor') %>" id="FE_SwitchOn"/>
	<input type="button" value="<% _t('FrontendEdit.STOP_EDITING','Close Editor') %>" id="FE_SwitchOff"/>
	
</div>
<% end_if %>