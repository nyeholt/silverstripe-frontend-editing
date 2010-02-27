<?php

define('FRONTEND_EDIT_PREFIX', 'frontendedit');

Director::addRules(100, array(
	FRONTEND_EDIT_PREFIX.'//$Action' => 'EditablePage_Controller',
));


// Explicit include to ensure the FrontendEditable class is available for extending others
include_once dirname(__FILE__).'/code/EditablePage.php';
Object::add_extension('SiteTree', 'FrontendEditable');

?>