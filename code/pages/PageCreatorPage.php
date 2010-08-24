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
 * A page type that lets user of the website create new content items from the
 * frontend of the system
 *
 * @author Marcus Nyeholt <marcus@silverstripe.com.au>
 */
class PageCreatorPage extends Page
{
	public static $additional_types = array();
	
    public static $db = array(
		'CreateType' => 'Varchar(32)',
	);

	public static $has_one = array(
		'CreateLocation' => 'Page',
	);

	public static $allowed_actions = array(
		'CreateForm',
		'createpage',
	);

	public function getCMSFields() {
		$fields = parent::getCMSFields();

		$types = ClassInfo::implementorsOf('FrontendCreatable');
		
		if (!$types) {
			$types = array();
		}

		$types = array_merge($types, self::$additional_types);

		$types = array_combine($types, $types);

		$fields->addFieldToTab('Root.Content.Main', new DropdownField('CreateType', _t('FrontendEditing.CREATE_TYPE', 'Create pages of which type?'), $types));
		$fields->addFieldToTab('Root.Content.Main', new TreeDropdownField('CreateLocationID', _t('FrontendEditing.CREATE_LOCATION', 'Create new pages where?'), 'Page'));

		return $fields;
	}

}

class PageCreatorPage_Controller extends Page_Controller
{
	public function Form()
	{
		return $this->CreateForm();
	}

	public function CreateForm()
	{
		$type = $this->CreateType;
		$fields = new FieldSet(
			new TextField('Title', _t('PageCreateorPage.TITLE', 'Title'))
		);

		if ($type) {
			$obj = singleton($type);
			if ($obj && $obj instanceof FrontendCreatable) {
				$myFields = $obj->getFrontendCreateFields();
				if ($myFields) {
					$fields = $myFields;
				}
			} else if ($obj instanceof Member) {
				$fields = $obj->getMemberFormFields();
			}
		} else {
			$fields = new FieldSet(
				new LiteralField('InvalidType', 'Page is incorrectly configured')
			);
		}
		
		$actions = new FieldSet(
			new FormAction('createpage', _t('PageCreateorPage.CREATE_PAGE', 'Create'))
		);

		$form = new Form($this, 'CreateForm', $fields, $actions);
		return $form;
	}

	/**
	 *
	 * Action called by the form to actually create a new page object. 
	 *
	 * @param SS_HttpRequest $request
	 * @param Form $form
	 */
	public function createpage($request, Form $form)
	{
		// create a new object and bind the form data
		$pid = $this->CreateLocation()->ID;
		if (!$pid) {
			$pid = 0;
		}
		$type = $this->CreateType;
		$obj = new $type;
		$form->saveInto($obj);

		$obj->ParentID = $pid;

		Versioned::reading_stage('Stage');

		$obj->write('Stage');
		// redirect to the created object
		Director::redirect($obj->Link().'?stage=Stage');
	}
}
?>