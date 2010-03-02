<?php

define('FRONTEND_EDIT_PREFIX', 'frontendedit');

Director::addRules(100, array(
	FRONTEND_EDIT_PREFIX.'//$Action' => 'EditablePage_Controller',
));

// Add something like the following for pages that you are going to use frontend editing on
// Object::add_extension('Page', 'FrontendEditableExtension');

?>