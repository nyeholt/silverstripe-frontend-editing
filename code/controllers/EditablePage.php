<?php

/**
 * The controller that handles editing submissions from the frontend.
 */
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

?>