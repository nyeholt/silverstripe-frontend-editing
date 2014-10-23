<?php
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