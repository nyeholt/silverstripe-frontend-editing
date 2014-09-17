<?php

/**
 * Controller that manages the updating of lock information for
 * a page. 
 *
 * @author Marcus Nyeholt <marcus@silverstripe.com.au>
 */
class LockableController extends Controller {

	public static $allowed_actions = array(
		'updatelock',
		'updatelocks',
	);

	public function updatelocks() {
		$ids = $this->request->postVar('lock');

		$response = new stdClass();
		$response->status = 0;
		$response->message = _t('FrontendLockable.ID_NOT_FOUND', 'The page ID was not specified');
	
		if (!is_array($ids)) {
			return Convert::raw2json($response);
		}

		$failed = array();
		
		foreach ($ids as $id) {
			$page = Page::get()->byID($id);
			if ($page->ID && $page->canEdit()) {
				// forcefully take the lock if possible
				$lock = $page->getEditingLocks(true);
				

				if ($lock != null && $lock['user'] != Member::currentUser()->Email) {
					// someone else has stolen it !
					$failed[] = $page->ID; // _t('FrontendLockable.LOCK_STOLEN', "Another user (" . $lock['user'] . ") has forcefully taken this lock");
				} else if ($lock != null) {
					$response->message = 'Lock updated successfully, locked until ' . $lock['expires'];
				}
			} else {
				// $failed[] = _t('FrontendLockable.PAGE_NOT_FOUND', 'The page with ID ' . $pageId . ' was not found');
				$failed[] = $page->ID;
			}
		}

		$response->status = 1;
		$response->message = 'Lock updated succesfully';
		
		if (count($failed)) {
			if (count($failed) == count($ids)) {
				$response->status = 0;
				$response->message = _t('FrontendLockable.PAGE_NOT_FOUND', 'The page with ID ' . $pageId . ' was not found');
			} else {
				$response->message = _t('FrontendLockable.SOME_LOCKS_FAILED', 'Some pages could not be locked: ' . implode(', ', $failed));
			}
		}

		return Convert::raw2json($response);
	}

	/**
	 * Updates the lock held by the current user
	 *
	 * @return String
	 */
	public function updatelock() {
		$response = new stdClass();
		$pageId = $this->urlParams['ID'];
		if (!$pageId) {
			$response->status = 0;
			$response->message = _t('FrontendLockable.ID_NOT_FOUND', 'The page ID was not specified');
		} else {
			$page = DataObject::get_by_id('Page', $pageId);
			if ($page->ID && $page->canEdit()) {
				// forcefully take the lock if possible
				$lock = $page->getEditingLocks(true);
				$response->status = 1;
				$response->message = 'Lock updated succesfully';

				if ($lock != null && $lock['user'] != Member::currentUser()->Email) {
					// someone else has stolen it !
					$response->status = 0;
					$response->message = _t('WikiPage.LOCK_STOLEN', "Another user (" . $lock['user'] . ") has forcefully taken this lock");
				} else if ($lock != null) {
					$response->message = 'Lock updated successfully, locked until ' . $lock['expires'];
				}
			} else {
				$response->status = 0;
				$response->message = _t('FrontendLockable.PAGE_NOT_FOUND', 'The page with ID ' . $pageId . ' was not found');
			}
		}

		return Convert::raw2json($response);
	}

}
