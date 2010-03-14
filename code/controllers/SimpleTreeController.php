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
 * Controller that handles requests for data to manage the tree
 *
 * @author Marcus Nyeholt <marcus@silverstripe.com.au>
 */
class SimpleTreeController extends Controller
{
	/**
	 * Request nodes from the server
	 *
	 * @param SS_HTTPRequest $request
	 * @return JSONString
	 */
    public function childnodes($request)
	{
		$data = array();

		$rootObjectType = 'SiteTree';
		if ($request->param('ID')) {
			$rootObjectType = $request->param('ID');
		}

		if ($request->getVar('search')) {
			return $this->performSearch($request->getVar('search'), $rootObjectType);
		}

		$parentId = $request->getVar('id');
		if (!$parentId) {
			$parentId = $rootObjectType.'-0';
		}

		$selectable = null;

		if ($request->param('OtherID')) {
			$selectable = explode(',', $request->param('OtherID'));
		}

		list($type, $id) = explode('-', $parentId);
		if (!$type || $id < 0) {
			$data = array(0 => array('data' => 'An error has occurred'));
		} else {
			$children = null;
			if ($id == 0) {
				$children = DataObject::get($rootObjectType, 'ParentID = 0');
			} else {
				$object = DataObject::get_by_id($type, $id);
				$children = $this->childrenOfNode($object);
			}

			$data = array();
			foreach ($children as $child) {
				if ($child->ID < 0) {
					continue;
				}
				$haskids = $child->numChildren() > 0;
				$nodeData = array(
					'title' => isset($child->MenuTitle) ? $child->MenuTitle : $child->Title,
				);
				if ($selectable && !in_array($child->ClassName, $selectable)) {
					$nodeData['clickable'] = false;
				}
				if (!$haskids) {
					$nodeData['icon'] = 'frontend-editing/images/page.png';
				}
				$data[] = array(
					'attributes' => array('id' => $rootObjectType. '-' . $child->ID, 'title' => Convert::raw2att($nodeData['title']), 'link' => $child->RelativeLink()),
					'data' => $nodeData,
					'state' => $haskids ? 'closed' : 'open'
				);
			}
		}
		
		return Convert::raw2json($data);
	}

	/**
	 * Method to work around bug where Hierarchy.php directly refers to
	 * ShowInMenus, which is only available on SiteTree
	 *
	 * @param DataObject $node
	 * @return DataObjectSet
	 */
	protected function childrenOfNode($node)
	{
		$result = $node->stageChildren(true);
		if(isset($result)) {
			foreach($result as $child) {
				if(!$child->canView()) {
					$result->remove($child);
				}
			}
		}

		return $result;
	}

	/**
	 * Search for a node based on the passed in criteria. The output is a list
	 * of nodes that should be opened from the top down
	 *
	 */
	protected function performSearch($query, $rootObjectType = 'SiteTree')
	{
		$item = null;

		if(preg_match('/\[sitetree_link id=([0-9]+)\]/i', $query, $matches)) {
			$item = DataObject::get_by_id($rootObjectType, $matches[1]);
			
		} else if (preg_match ('/^assets\//', $query)) {
			// search for the file based on its filepath
			$item = DataObject::get_one($rootObjectType, db_quote(array ('Filename =' => $query)));
		}

		if ($item && $item->ID) {
			$items = array();
			while ($item->ParentID != 0) {
				array_unshift($items, $rootObjectType.'-'.$item->ID);
				$item = $item->Parent();
			}

			array_unshift($items, $rootObjectType.'-'.$item->ID);
			return implode(',', $items);
		}

		return '';
	}
}
?>