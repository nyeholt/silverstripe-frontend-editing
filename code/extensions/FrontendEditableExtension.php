<?php

/**
 * An extension that allows theme authors to mark certain regions as editable
 *
 * @author Marcus Nyeholt <marcus@silverstripe.com.au>
 */
class FrontendEditableExtension extends DataExtension {

	public static $has_one = array(
		'Creator' => 'Member',
	);

	/**
	 * Make sure to set a creator!
	 */
	public function onBeforeWrite() {
		if (!$this->owner->CreatorID) {
			$this->CreatorID = Member::currentUserID();
		}
	}

	/**
	 * Each page that is editable should have an "Owner" 
	 *
	 * @param FieldSet $fields
	 */
	public function updateCMSFields(FieldList $fields) {
		$members = DataObject::get('Member');
		$ids = $members->column('ID');
		$unames = $members->column('Email');
		$users = array_combine($ids, $unames);

		if (!$this->owner->CreatorID) {
			$this->owner->CreatorID = Member::currentUserID();
		}

		$fields->addFieldToTab('Root.Main', new DropdownField('CreatorID', 'Owner', $users), 'Content');
	}

	/**
	 * Are we viewing this page on the live site?
	 *
	 * @return boolean
	 */
	public function LiveSite() {
		return Versioned::current_stage() == 'Live';
	}

	/**
	 * Indicates whether the current user can edit the current fields on the frontend
	 *
	 * @param String $checkStage
	 * 			If set, the stage will be checked to ensure that we're on that stage - this
	 * 			allows us to check if the current user has got access to edit (regardless of whether they're on the
	 * 			right stage), and to check including the right stage
	 *
	 * @return boolean
	 */
	public function FrontendEditAllowed($checkStage = true) {
		if (!Member::currentUserID()) {
			return false;
		}
		$isCreator = Member::currentUserID() == $this->owner->CreatorID;
		$canEdit = $this->owner->canEdit();
		$frontendPerm = Permission::check(FrontendEditing_Controller::PERM_FRONTEND_EDIT);

		if ($checkStage === true) {
			$stage = Versioned::current_stage() == 'Stage';
		} else {
			$stage = true;
		}

		if (!($isCreator || $canEdit || $frontendPerm) || !$stage) {
			return false;
		}
		return true;
	}

	/**
	 * Return an html fragment that can be used for editing a given field on the frontend of the website
	 *
	 * @TODO: Refactor this so that the field creation etc is actually done based on the type of the
	 * field - eg if it's an HTML field use niceditor, if it's a text field use textfield, etc etc
	 *
	 * Needs some adjustment to the frontend so that fields other than the native nicedit work nicely.
	 *
	 * @param String $fieldName
	 * @param String $tagType
	 * @return String
	 */
	public function EditableField($fieldName, $tagType = 'div') {
		Requirements::javascript(THIRDPARTY_DIR . '/jquery/jquery.js');
		Requirements::javascript('frontend-editing/javascript/edit-controls.js');
		Requirements::css('frontend-editing/css/edit-controls.css');

		// output only if the user can edit, otherwise we just output the field
		if ($this->FrontendEditAllowed()) {
			Requirements::css('frontend-editing/css/page-editor.css');

			Requirements::css('frontend-editing/javascript/jstree/themes/default/style.css');

			Requirements::css('frontend-editing/javascript/jquery.jgrowl.css');
			Requirements::javascript('frontend-editing/javascript/jquery.jgrowl_minimized.js');

			Requirements::javascript('frontend-editing/javascript/jstree-0.9.9a2/jquery.tree.js');
			Requirements::javascript('frontend-editing/javascript/jquery.json.js');
			Requirements::javascript('frontend-editing/javascript/nicEditDev.js');

			Requirements::javascript('frontend-editing/javascript/page-editor.js');

			Requirements::javascript('frontend-editing/javascript/nicedit-table.js');
			Requirements::javascript('frontend-editing/javascript/nicedit-image-selector.js');
			Requirements::javascript('frontend-editing/javascript/nicedit-class-selector.js');
			Requirements::javascript('frontend-editing/javascript/nicedit-url-selector.js');


			$ID = $this->owner->ID;
			$typeInfo = $this->owner->ClassName . '-' . $ID;
			// now add the wrapped field
			return '<' . $tagType . ' data-security-id="' . SecurityToken::inst()->getSecurityID() . '" class="__wysiwyg-editable" id="' . $typeInfo . '|' . $ID . '|' . $fieldName . '">' . 
				$this->owner->XML_val($fieldName) . '</' . $tagType . '>';
		} else {
			return $this->owner->XML_val($fieldName);
		}
	}

}