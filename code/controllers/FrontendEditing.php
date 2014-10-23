<?php

/**
 * The controller that handles editing submissions from the frontend.
 */
class FrontendEditing_Controller extends Controller implements PermissionProvider {
	
	private static $allowed_actions = array(
		'getcontent'	=> 'PERM_FRONTEND_EDIT',
		'frontendCommit'	=> 'PERM_FRONTEND_PUBLISH',
		'frontendSave'	=> 'PERM_FRONTEND_EDIT',
		'validateId',
		'createpage'	=> 'PERM_FRONTEND_EDIT',
		'deletepage' => 'PERM_FRONTEND_PUBLISH',
		'batchcontent'	=> 'PERM_FRONTEND_EDIT',
	);

	const PERM_FRONTEND_EDIT = 'PERM_FRONTEND_EDIT';
	const PERM_FRONTEND_PUBLISH = 'PERM_FRONTEND_PUBLISH';

	/**
	 * Implementation that provides the following permissions
	 *
	 * FrontendEdit
	 * FrontendPublish
	 * 
	 */
	public function providePermissions() {
		return array(
			self::PERM_FRONTEND_EDIT => array(
				'name' => _t('FrontendEditing.PERM_FRONTEND_EDIT', 'Edit Pages on the Frontend'),
				'category' => _t('FrontendEditing.FRONTEND_EDIT_CATEGORY', 'Frontend Editing'),
				'sort' => -100,
				'help' => _t('FrontendEditing.PERM_EDIT_HELP', 'Allows users to edit pages on the frontend of the site. Note - you must also give them access to draft content!')
			),
			self::PERM_FRONTEND_PUBLISH => array(
				'name' => _t('FrontendEditing.PERM_FRONTEND_PUBLISH', 'Publish pages from the frontend'),
				'category' => _t('FrontendEditing.FRONTEND_EDIT_CATEGORY', 'Frontend Editing'),
				'sort' => -100,
				'help' => _t('FrontendEditing.PUBLISH_PAGES_HELP', 'Allows users to publish pages directly from the frontend.')
			),
		);
	}

	/**
	 * Commit a page changed via the frontend editing
	 *
	 * @return
	 */
	public function frontendCommit() {
		if (!SecurityToken::inst()->check($this->request->postVar('SecurityID'))) {
			return singleton('FEUtils')->ajaxResponse('Invalid security token', false);
		}
//		Versioned::choose_site_stage();
		$urlName = isset($_POST['url']) ? $_POST['url'] : null;

		if ($urlName) {
			$obj = $this->Page($urlName);
			if ($obj->canPublish()) {
				$obj->write();
				$obj->doPublish();
			}
		}

//		Versioned::choose_site_stage();
		$return = new stdClass();
		$return->success = 0;
		$return->message = "Data not found";

		$data = isset($_POST['data']) ? $_POST['data'] : null;
		if ($data) {
			// deserialise
			$data = json_decode($data);
			$topublish = $data->toPublish;
			foreach ($topublish as $typeInfo => $nothing) {
				list($type, $id) = explode('-', $typeInfo);
				if ($id) {
					// set all the contents on the item
					$obj = DataObject::get_by_id($type, $id);
					if ($obj) {
						if ($obj->FrontendEditAllowed() && $obj->doPublish()) {
							$return->success = 1;
							$return->message = _t('FrontendEditing.PUBLISH_SUCCESSFUL', "Successfully published page");
						} else {
							$return->message = _t('FrontendEditing.PUBLISH_NOT_ALLOWED', "You cannot publish that content.");
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
	
	public function createpage() {
		$relation = $this->request->postVar('relation');
		$context = (int) $this->request->postVar('context');
		$to = (int) $this->request->postVar('to');
		
		$type = $this->request->postVar('type');
		
		if (!$to) {
			$to = 0;
		}
		
		if ($relation && $to) {
			$page = Page::get()->byID($to);
			$to = $page ? $page->ParentID : 0;
		}

		if (!$type) {
			$type = 'Page';
		}
		$newSort = 0;
		
		$contextPage = Page::get()->byID($context);
		if ($contextPage) {
			$newSort = $contextPage->Sort + 1;
		}

		$newPage = $type::create();
		$newPage->Title = 'New ' . $type;
		$newPage->ParentID = $to;
		$newPage->Sort = $newSort;
		$newPage->write();
		
		return $newPage->ID;
	}
	
	public function deletepage() {
		$pageId = (int) $this->request->postVar('page');
		if ($pageId) {
			$page = Page::get()->byID($pageId);
			if ($page) {
				$page->doUnpublish();
				$page->delete();
			}
		}
		
		return $pageId;
	}

	/**
	 * Save data into the requested object. Need to make sure that we have a logged in
	 * user, and we're operating on the draft stage (can't edit the published stuff directly!)
	 *
	 * @return unknown_type
	 */
	public function frontendSave() {
		if (!$this->validateId(isset($_POST['SecurityID']) ? $_POST['SecurityID'] : null)) {
			return singleton('FEUtils')->ajaxResponse('Invalid security token', false);
		}

//		Versioned::choose_site_stage();
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
					list($type, $otherid) = explode('-', $typeInfo);
					// set all the contents on the item
					$obj = DataObject::get_by_id($type, $id);
					if ($obj) {
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
						$return->message = sprintf(_t('FrontendEditing.PAGE_MISSING', 'Page %s could not be found'), $id);
					}
				} else {
					$return->message = sprintf(_t('FrontendEditing.PAGE_MISSING', 'Page %s could not be found'), $id);
				}
			}
		}

		return Convert::raw2json($return);
	}

	protected function validateId($id) {
		if (!$id || $id != Session::get('SecurityID')) {
			return false;
		}
		return true;
	}

	/**
	 * Gets the content for a particular node. This takes a single parameter to indicate whether
	 * to get the RAW content, or whether to get the escaped content that should appear (eg XML_Val) so that
	 * things like URLs etc resolve correctly
	 */
	public function getcontent($request) {
//		Versioned::choose_site_stage();
		$item = $request->param('ID');
		$form = $request->param('OtherID');
		$return = new stdClass();
		$return->success = 0;
		$return->message = "Data not found";

		if ($item) {
			list($type, $id, $field) = explode('-', $item);
			$item = DataObject::get_by_id($type, $id);
			if ($item && $item->FrontendEditAllowed()) {
				// safe to return data
				$return->success = 1;
				$return->message = "";
				$return->data = $form == 'raw' ? $item->getField($field) : $item->XML_val($field);
			}
		}

		return Convert::raw2json($return);
	}
	
	public function batchcontent() {
		$objects = $this->request->getVar('objects');
		$format = $this->request->getVar('format');
		
		$return = new stdClass();
		$return->success = 0;
		$return->message = "Data not found";

		$return->data = array();
		
		if (is_array($objects) && count($objects)) {
			foreach ($objects as $itemKey) {
				list($type, $id, $field) = explode('-', $itemKey);
				$item = DataObject::get_by_id($type, $id);
				if ($item && $item->FrontendEditAllowed()) {
					// safe to return data
					$return->success = 1;
					$return->message = "";
					$return->data[$itemKey] = $format == 'raw' ? $item->getField($field) : $item->XML_val($field);
				}
			}
		}

		$this->response->addHeader('Content-Type', 'application/json');
		return Convert::raw2json($return);
	}
}
