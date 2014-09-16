<?php
/**
 * Controller that manages the updating of lock information for
 * a page. 
 *
 * @author Marcus Nyeholt <marcus@silverstripe.com.au>
 */
class LockableController extends Controller
{
	public static $allowed_actions = array(
		'updatelock'
	);

	/**
	 * Updates the lock held by the current user
	 *
	 * @return String
	 */
    public function updatelock()
	{
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
					$response->message = _t('WikiPage.LOCK_STOLEN', "Another user (".$lock['user'].") has forcefully taken this lock");
				} else if ($lock != null) {
					$response->message = 'Lock updated successfully, locked until '.$lock['expires'];
				}
			} else {
				$response->status = 0;
				$response->message = _t('FrontendLockable.PAGE_NOT_FOUND', 'The page with ID '.$pageId.' was not found');
			}
		}
		
		return Convert::raw2json($response);
	}
}