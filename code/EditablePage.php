<?php

class EditablePage_Controller extends Page_Controller {

	public function init() {
		parent::init();
	}

	/**
	 * Commit a page changed via the frontend editing
	 *
	 * @return
	 */
	public function frontendCommit()
	{
		$urlName = isset($_POST['url']) ? $_POST['url'] : null;
		if ($urlName) {
			
			$obj = $this->Page($urlName);
			if ($obj->canPublish()) {
				// unlock
				$this->owner->LockedBy = '';
				$this->owner->write();
				$obj->doPublish();
			}
		}
	}

	/**
	 * Save data into the requested object. Need to make sure that we have a logged in
	 * user, and we're operating on the draft stage (can't edit the published stuff directly!)
	 *
	 * @return unknown_type
	 */
	public function frontendSave()
	{
		if(!$this->FrontendEditAllowed()) {
			$link = $this->Link();
			$message = _t("ContentController.DRAFT_SITE_ACCESS_RESTRICTION", 'You must log in with your CMS password in order to view the draft or archived content.  <a href="%s">Click here to go back to the published site.</a>');
			return Security::permissionFailure($this, sprintf($message, "$link?stage=Live"));
		}

		$data = isset($_POST['data']) ? $_POST['data'] : null;

		if ($data) {
			// deserialise
			$data = json_decode($data);
			foreach ($data as $urlName => $properties) {
				$id = $properties->ID;
				if ($id) {
					// set all the contents on the item
					$obj = $this->Page($urlName);
					if ($obj->canEdit()) {
						unset($properties->ID);
						$obj->update($properties);
						$result = $obj->write();
					}
				}
			}
		}
	}
}

class FrontendEditable extends DataObjectDecorator
{
	/**
	 * Add the 'lockedby' field
	 *
	 * @see core/model/DataObjectDecorator#extraStatics()
	 */
	public function extraStatics() {
		return array(
			'db' => array(
				'LockedBy' => 'Text',
			)
		);
	}

	public function updateCMSFields(FieldSet &$fields) {
		$fields->addFieldToTab('Root.Locking', new TextField('LockedBy', _t('EditablePage.LOCKEDBY'), '', 20));
	}

	public function FrontendEditAllowed()
	{
		if (!($this->owner->canEdit() && Versioned::current_stage() == 'Stage')) {
			return false;
		}
		
		$currentLocker = $this->owner->LockedBy;
		$currentUser = Member::currentUser()->Email;
		if (strlen($currentLocker) == 0) {
			// lock
			$this->lockObject($this->owner, $currentUser);
			return true; 
		} else {
			return $currentLocker == $currentUser;
		}
	}
	
	public function lockObject($object, $user) {
		$object->LockedBy = $user;
		$object->write();
	}

	public function EditableField($fieldName, $tagType='div')
	{
		$fieldValue = $this->owner->getField($fieldName);
		// output only if the user can edit, otherwise we just output the field
		if ($this->FrontendEditAllowed()) {
			Requirements::css('frontend-editing/javascript/page-editor.css');
			Requirements::javascript('frontend-editing/javascript/jquery.json.js');
			Requirements::javascript('frontend-editing/javascript/nicEditDev.js');
			Requirements::javascript('frontend-editing/javascript/page-editor.js');

			$urlPrefix = Director::baseURL() . FRONTEND_EDIT_PREFIX;
			$frontendEditor = <<<HTML
			jQuery().ready(function() {
				var frontendEditor = new SSFrontend.FrontendEditor({saveUrl:"$urlPrefix/frontendSave", commitUrl: "$urlPrefix/frontendCommit"});
			});
HTML;
			Requirements::customScript($frontendEditor, 'frontend_editor_script');

			$urlSegment = $this->owner->URLSegment;
			$ID = $this->owner->ID;

			// now add the wrapped field
			return '<'.$tagType.' class="__editable __wysiwyg-editable" id="'.$urlSegment.'|'.$ID.'|'.$fieldName.'">'.$fieldValue.'</'.$tagType.'>';
		} else {
			return $fieldValue;
		}
	}
}

?>