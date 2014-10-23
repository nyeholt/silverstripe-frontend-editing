<?php
/**
 * A data object that implements defines specific fields that
 * should be displayed on the frontend during the creation process.
 *
 * @author Marcus Nyeholt <marcus@silverstripe.com.au>
 */
interface FrontendCreatable
{
    public function getFrontendCreateFields();
}