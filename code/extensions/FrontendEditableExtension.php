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
 * An extension that allows theme authors to mark certain regions as editable
 *
 * @author Marcus Nyeholt <marcus@silverstripe.com.au>
 */
class FrontendEditableExtension extends DataObjectDecorator implements PermissionProvider
{
	const CAN_FRONTEND_EDIT = "FRONTEND_EDIT";

	public function extraStatics()
	{
		return array(
			'has_one' => array(
				'Creator' => 'Member',
			)
		);
	}

	/**
	 * Make sure to set a creator!
	 */
	public function onBeforeWrite()
	{
		if (!$this->owner->CreatorID) {
			$this->CreatorID = Member::currentUserID();
		}
	}

	/**
	 * Let the user be modified on the frontend
	 *
	 * @param FieldSet $fields
	 */
	public function updateCMSFields($fields)
	{
		$members = DataObject::get('Member');
		$ids = $members->column('ID');
		$unames = $members->column('getTitle');
		$users = array_combine($ids, $unames);
		$fields->addFieldToTab('Root.Content.Main', new DropdownField('CreatorID', 'Owner', $users), 'Content');
	}

	/**
	 * Define some permissions used for editing wiki pages
	 *
	 * @return array
	 */
	public function providePermissions()
	{
		return array(
			self::CAN_FRONTEND_EDIT => array (
				'name' =>  _t('FrontendEditable.PERM_EDIT_FRONTEND', 'Frontend Editing'),
				'category' => 'Content permissions',
				'sort' => -100,
				'help' => _t('FrontendEditable.PERM_EDIT_FRONTEND', 'Edit page content on the frontend of the site, where applicable')
			),
		);
	}

	/**
	 * Indicates whether the current user can edit the current fields on the frontend
	 *
	 * @return boolean
	 */
	public function FrontendEditAllowed()
	{
		$isCreator = Member::currentUserID() == $this->owner->CreatorID;
		$canEdit = $this->owner->canEdit();
		$frontendPerm = Permission::check(self::CAN_FRONTEND_EDIT);
		$stage = Versioned::current_stage() == 'Stage';
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
	public function EditableField($fieldName, $tagType='div')
	{
		$fieldValue = $this->owner->getField($fieldName);
		// output only if the user can edit, otherwise we just output the field
		if ($this->FrontendEditAllowed()) {
			// try and take the lock
			$lock = $this->owner->getEditingLocks(true);
			Requirements::css('frontend-editing/javascript/page-editor.css');
			// we can't edit if there's a lock and that locking user is NOT us
			if ($lock != null && $lock['user'] != Member::currentUser()->Email) {
				return '<div class="__editable_locked">'.$fieldValue.'<p class="lockInfo">'.sprintf(_t('FrontendEdit.LOCKED_BY', 'Locked by %s until %s'), $lock['user'], $lock['expires']).'</p></div>';
			} else {

				Requirements::css('frontend-editing/javascript/jstree/themes/default/style.css');

				Requirements::javascript('frontend-editing/javascript/jstree/jquery.tree.js');
				Requirements::javascript('frontend-editing/javascript/jquery.json.js');
				Requirements::javascript('frontend-editing/javascript/nicEditDev.js');
				Requirements::javascript('frontend-editing/javascript/nicedit-table.js');
				Requirements::javascript('frontend-editing/javascript/nicedit-tree.js');
				Requirements::javascript('frontend-editing/javascript/nicedit-url-selector.js');
				Requirements::javascript('frontend-editing/javascript/page-editor.js');

				$base = Director::baseURL();
				$urlPrefix = Director::baseURL() . FRONTEND_EDIT_PREFIX;
				$frontendEditor = <<<HTML
				window.SILVERSTRIPE_BASE = '$base';
				jQuery().ready(function() {
					var frontendEditor = new SSFrontend.FrontendEditor({saveUrl:"$urlPrefix/frontendSave", commitUrl: "$urlPrefix/frontendCommit"});
				});
HTML;
				$lockUpdate = $this->owner->getLockUpdater();
				Requirements::customScript($frontendEditor, 'frontend_editor_script');
				Requirements::customScript($lockUpdate, 'lock_updater_for_'.$this->owner->ID);

				$urlSegment = $this->owner->URLSegment;
				$ID = $this->owner->ID;

				// now add the wrapped field
				return '<'.$tagType.' class="__editable __wysiwyg-editable" id="'.$urlSegment.'|'.$ID.'|'.$fieldName.'">'.$fieldValue.'</'.$tagType.'>';
			}
		} else {
			return $this->owner->XML_val($fieldName);
		}
	}
}
?>