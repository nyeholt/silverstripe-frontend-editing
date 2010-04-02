<?php

/**
 * The controller that handles editing submissions from the frontend.
 */
class FrontendEditing_Controller extends Controller
{
	/**
	 * Commit a page changed via the frontend editing
	 *
	 * @return
	 */
	public function frontendCommit()
	{
		Versioned::choose_site_stage();
		$urlName = isset($_POST['url']) ? $_POST['url'] : null;
		if ($urlName) {
			$obj = $this->Page($urlName);
			if ($obj->canPublish()) {
				$obj->write();
				$obj->doPublish();
			}
		}

		Versioned::choose_site_stage();
		$return = new stdClass();
		$return->success = 0;
		$return->message = "Data not found";

		$data = isset($_POST['data']) ? $_POST['data'] : null;
		if ($data) {
			// deserialise
			$data = json_decode($data);
			$topublish = $data->toPublish;
			foreach ($topublish as $typeInfo => $nothing) {
				list($type, $id) = split('-', $typeInfo);
				if ($id) {
					// set all the contents on the item
					$obj = DataObject::get_by_id($type, $id);
					if ($obj) {
						$lock = $obj->getEditingLocks();
						if (!isset($lock['LastEditor']) || $lock['LastEditor'] == Member::currentUser()->Email) {
							if ($obj->FrontendEditAllowed()) {
								$obj->doPublish();
								$return->success = 1;
								$return->message = "Successfully published page #$id";
							} else {
								$return->message = "You cannot edit that object.";
							}
						} else {
							$return->message = sprintf(_t('FrontendEditing.PAGE_LOCKED', 'That page is currently locked by %s'), $lock['user']);
						}
					} else {
						$return->message = sprintf(_t('FrontendEditing.PAGE_MISSING', 'Page %s could not be found'), $id);
					}
				} else {
					$return->message = sprintf(_t('FrontendEditing.PAGE_MISSING', 'Page %s could not be found'), $id);
				}
			}
		}

		return Convert::raw2json($return);
	}

	/**
	 * Save data into the requested object. Need to make sure that we have a logged in
	 * user, and we're operating on the draft stage (can't edit the published stuff directly!)
	 *
	 * @return unknown_type
	 */
	public function frontendSave()
	{
		Versioned::choose_site_stage();
		$return = new stdClass();
		$return->success = 0;
		$return->message = "Data not found";

		$data = isset($_POST['data']) ? $_POST['data'] : null;
		if ($data) {
			// deserialise
			$data = json_decode($data);
			foreach ($data as $typeInfo => $properties) {
				$id = $properties->ID;
				if ($id) {
					list($type, $otherid) = split('-', $typeInfo);
					// set all the contents on the item
					$obj = DataObject::get_by_id($type, $id);
					if ($obj) {
						$lock = $obj->getEditingLocks();
						if (!isset($lock['LastEditor']) || $lock['LastEditor'] == Member::currentUser()->Email) {
							if ($obj->FrontendEditAllowed()) {
								unset($properties->ID);
								$obj->update($properties);
								$result = $obj->write();

								$return->success = $result;
								$return->message = "Successfully saved page #$id";
							} else {
								$return->message = "You cannot edit that object.";
							}
						} else {
							$return->message = sprintf(_t('FrontendEditing.PAGE_LOCKED', 'That page is currently locked by %s'), $lock['user']);
						}
					} else {
						$return->message = sprintf(_t('FrontendEditing.PAGE_MISSING', 'Page %s could not be found'), $id);
					}
				} else {
					$return->message = sprintf(_t('FrontendEditing.PAGE_MISSING', 'Page %s could not be found'), $id);
				}
			}
		}

		return Convert::raw2json($return);
	}

	/**
	 * Gets the content for a particular node. This takes a single parameter to indicate whether
	 * to get the RAW content, or whether to get the escaped content that should appear (eg XML_Val) so that
	 * things like URLs etc resolve correctly
	 */
	public function getcontent($request) {
		Versioned::choose_site_stage();
		$item = $request->param('ID');
		$form = $request->param('OtherID');
		$return = new stdClass();
		$return->success = 0;
		$return->message = "Data not found";

		if ($item) {
			list($type, $id, $field) = explode('-', $item);
			$item = DataObject::get_by_id($type, $id);
			if ($item && $item->userHasLocks()) {
				if ($item->FrontendEditAllowed()) {
					// safe to return data
					$return->success = 1;
					$return->message = "";
					$return->data = $form == 'raw' ? $item->getField($field) : $item->XML_val($field);
				}
			}
		}

		return Convert::raw2json($return);
	}
}

?>