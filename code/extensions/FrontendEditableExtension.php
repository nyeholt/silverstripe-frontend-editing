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
 * @author Marcus Nyeholt <marcus@silverstripe.com.au>
 */
class FrontendEditableExtension extends DataObjectDecorator
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