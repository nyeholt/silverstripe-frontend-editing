<?php

/**
 * The controller that handles editing submissions from the frontend.
 */
class FrontendEditing_Controller extends Page_Controller
{
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
				$obj->write();
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
		$return = new stdClass();
		$return->success = 0;
		$return->message = "Data not found";
		
		$lock = $this->owner->getEditingLocks(true);

		if ($lock != null && $lock['user'] != Member::currentUser()->Email) {
			$return->message = sprintf(_t('FrontendEditing.PAGE_LOCKED', 'That page is currently locked by %s'), $lock['user']);
		} else {
			$data = isset($_POST['data']) ? $_POST['data'] : null;
			if ($data) {
				// deserialise
				$data = json_decode($data);
				foreach ($data as $urlName => $properties) {
					$id = $properties->ID;
					if ($id) {
						// set all the contents on the item
						$obj = $this->Page($urlName);
						
						if ($obj->FrontendEditAllowed()) {
							unset($properties->ID);
							$obj->update($properties);
							$result = $obj->write();

							$return->success = $result;
							$return->message = "Successfully saved page #$id";
						}
					}
				}
			}
		}

		return Convert::raw2json($return);
	}
}

?>