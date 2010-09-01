<?php
/*

Copyright (c) 2009, SilverStripe Australia PTY LTD - www.silverstripe.com.au
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of SilverStripe nor the names of its contributors may be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
OF SUCH DAMAGE.
*/

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