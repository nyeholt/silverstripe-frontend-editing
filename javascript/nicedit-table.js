function SystemColor() {
  return colorList = {
    0:'ffcccc',   1:'ff98b5',   3:'ff6c93',   4:'ff4f7f',   5:'ff1352',
    6:'f00240',   7:'d20035',   8:'b3002d',   9:'990026',   10:'840021',  11:'65001a',
    24:'fedda3',  25:'f9d69e',  27:'e4c086',  28:'d7b377',  29:'caa567',
    30:'bb9756',  31:'ac8744',  32:'9e7935',  33:'916c26',  34:'835d17',  35:'624209',
    60:'fff2d8',  61:'ffedc7',  62:'ffe8b7',  63:'ffe2a1',  64:'ffdb87',
    65:'ffd36c',  66:'ffcc52',  67:'ffc53a',  68:'ffbe23',  69:'ffb810',  70:'ffb400',
    36:'fffed1',  37:'fefec4',  38:'fefeb4',  39:'fefe9b',  40:'fefe83',
    41:'fefe68',  42:'fdfe50',  43:'fdff35',  44:'fcff22',  45:'fdfe0e',  46:'fcff00',
    144:'e1ffc9', 145:'daffbc', 146:'d0ffab', 147:'c4ff96', 148:'b8ff7e',
    149:'aaff65', 150:'9cff4d', 151:'90ff37', 152:'84ff21', 153:'7aff0f', 154:'72ff00',
    48:'e1ffc2',  49:'b1ff9a',  51:'71ff62',  52:'30ff2a',  53:'16ff13',
    54:'02ff01',  55:'00d200',  56:'00be00',  57:'009000',  58:'008100',  59:'005e00',
    72:'ceffe6',  73:'b7f0d2',  75:'98dcb8',  76:'7ac79e',  77:'6bbf93',
    78:'63b98b',  79:'529d74',  80:'4a916b',  81:'397655',  82:'326c4d',  83:'24513a',
    96:'dbf4ff',  97:'c7daff',  99:'b1bdff',  100:'989aff', 101:'8d8dff',
    102:'8583ff', 103:'6d76d7', 104:'5f6ebe', 105:'4a6499', 106:'405e87', 107:'2f4a65',
    108:'bff3ff', 109:'b5e8ff', 110:'a5d2ff', 111:'91baff', 112:'7c9dff',
    113:'627cff', 114:'4d62ff', 115:'3a49ff', 116:'2029ff', 117:'1015ff', 118:'0000ff',
    120:'f6d5ff', 121:'eda9ff', 123:'df6cff', 124:'d22eff', 125:'cc13ff',
    126:'c800ff', 127:'a400d2', 128:'9200ba', 129:'72008f', 130:'63007c', 131:'49005c',
    132:'ffffff', 133:'ececec', 135:'cfcfcf', 136:'bdbdbd', 137:'ababab',
    138:'989898', 139:'828283', 140:'6f6f6f', 141:'5a5a59', 142:'373737', 143:'000000'
  }
}

window.tableOptions = {
   buttons : {
      'table' : {name : 'Add Table', type : 'nicEditorTableButton', tags : ['table']}
   }
   ,iconFiles : {'table' : 'frontend-editing/javascript/table_add.png'}
};

window.nicEditorTableButton = nicEditorAdvancedButton.extend({
    width: '220px',
    addPane : function() {
		var colorList = SystemColor();

		var tblTitle = new bkElement('DIV')
		  .setStyle({
			width     : '90%',
			height    : '20px',
			fontSize  : '14px',
			fontWeight: 'bold'
		  })
		.appendTo(this.pane.pane)
		.setContent('Table Options');

		var style="border: 1px solid #ccc; margin: 3px 0 3px 2px; float: left; width: 8em";
		var label = 'width: 4.5em; float: left; line-height: 1.55em; display: block; clear: both;';

		var Ex = new bkElement('DIV')
		  .appendTo(this.pane.pane)
		  .setAttributes({id:'select'})
		  .setContent(
			'<div style="'+label+'">Cells:</div>'
			+'<input id="rows" type="text" value="1" style="width: 2em;  margin: 1px" />'
			+'<label> X </label><input id="cols" type="text" value="1" '
								+'style="width: 2em;  margin: 1px" /><br />'

			+'<div style="'+label+'">Border:</div>'
			+'<input id="brd" type="text" value="1" style="width: 2em; margin: 1px" /> '
			+'<input id="clps" type="checkbox" />'
			+'<label> collapse</label><br />'

			+'<label style="'+label+'"> Colour: </label>'
			+'<input id="clr" type="text" value="#000000" style="width: 5.5em; margin: 1px" /> '
			+'<label id="selClr" style="padding-top: .3em; background: #000; color: #000; '
			+'cursor: pointer; cursor: hand;">###</label>'
			+'<input id="clre" style="margin: 0 0 .15em 1em" type="checkbox" /><br />'

			+'<label id="BfLb" style="'+label+'">Padding: </label>'
			+'<input id="pad" type="text" value="2" style="width: 2em; margin: 1px" /><br />'

			+'<label style="'+label+'"> Width: </label>'
			+'<input id="wth" type="text" value="100" style="width: 2em; margin: 1px" /> '
			+'<input id="wthp" type="radio" checked name="per" /> % '
			+'<input type="radio" name="per" /> px <br />'
		  )
		  .addEvent('mouseover',this.on.closure(this,x,y));

		$BK('selClr').addEvent('click',this.clrOpen.closure(this,x,y));

		var clItems = new bkElement('DIV')
		  .setAttributes({id:'color'})
		  .setStyle({
			width     : '220px',
			display   : 'none'
		  });

		for(var c in colorList) {

			var colorCode = '#'+colorList[c];

			var clSquare = new bkElement('DIV')
			  .setStyle({
				cursor : 'pointer',
				height : '16px',
				width  : '16px',
				border : '1px solid #111',
				'float'  : 'left',
				margin : '1px'
			  })
			  .appendTo(clItems);

			var clInner = new bkElement('DIV')
			  .setStyle({
				overflow : 'hidden',
				margin   : 'auto',
				background:colorCode,
				height   : '16px'
			  })
			  .addEvent('click',this.clrClose.closure(this))
			  .addEvent('mouseover',this.clSelect.closure(this,colorCode))
			  .appendTo(clSquare);

		}
		clItems.noSelect().appendBefore($BK('BfLb'));

		new bkElement('input')
		  .setAttributes({id:'ok', type:'button', value: "OK"})
		  .setStyle({
			border: '1px solid #ccc',
			margin: '3px 0 3px 2px',
			width : '8em'
		  })
		  .addEvent('click',this.tdSelect.closure(this))
		  .appendTo(Ex);

		new bkElement('input')
		  .setAttributes({id:'mode', type:'button', value: "Show Grid"})
		  .setStyle({
			border: '1px solid #ccc',
			margin: '3px 0 3px 2px',
			width : '8em'
		  })
		  .addEvent('click',this.mode.closure(this))
		  .appendTo(Ex);

		//---------------------------------

		var tdItems = new bkElement('DIV')
		  .setAttributes({id:'table'})
		  .setStyle({
			width     : '220px',
			display   : 'none'
		  });

		for(var y=0;y<10;y++) {
		 for(var x=0;x<10;x++) {

			var tdSquare = new bkElement('DIV')
			  .setAttributes({id:'x'+x+'y'+y})
			  .setStyle({
				cursor : 'pointer',
				height : '16px',
				width  : '16px',
				border : '1px solid #111',
				'float'  : 'left',
				margin : '2px'
			  })
			  .appendTo(tdItems);

			var tdInner = new bkElement('DIV')
			  .setStyle({
				overflow : 'hidden',
				margin   : 'auto',
				height   : '16px'
			  })
			  .addEvent('click',this.tdSelect.closure(this))
			  .addEvent('mouseover',this.on.closure(this,x,y))
			  .addEvent('mouseout',this.off.closure(this,x,y))
			  .appendTo(tdSquare);

		 }
		}
		this.pane.append(tdItems.noSelect());

	 },

    tdSelect : function() {
		var tdpad =  ($BK('pad').value==2)?"":" style='"+"padding:"+$BK('pad').value+"px; '";
		var collapse = $BK('clps').checked?'collapse':'separate'
		var percent = $BK('wthp').checked?'%':'px'

		var cTable = "\n";
		for (var y=0;y<$BK('rows').value;y++) {
		  cTable=cTable+"\n<tr>\n";
		  for (var x=0;x<$BK('cols').value;x++) {
			cTable=cTable+"\t<td"+tdpad+">&nbsp;</td>\n";
		  }
		  cTable=cTable+"</tr>";
		}
		cTable=cTable+"\n";

		if (bkLib.isMSIE) {
		  tdpad = $BK('clre').checked?' bordercolor="'+$BK('clr').value+'"':'';
		  var t = new bkElement('').setContent(
			'<table border='+$BK('brd').value+tdpad
					+' style="border-collapse: '+collapse+'; width: '+$BK('wth').value+percent+';">'
			+cTable+
			'</table>'
		  );
		  t.appendTo(this.ne.selectedInstance.getElm());
		} else {
		  var t = new bkElement('table')
			.setAttributes({
				border          : $BK('brd').value,
				id              : 'brd-color'
			})
			.setStyle({
				width           : $BK('wth').value+percent,
				borderCollapse  : collapse
			})
			.setContent(cTable);
			/*  BOF sj
			var $tlbk=$BK('clre').checked
			var $tlbkval=$BK('clr').value
			tlv=this.ne.selectedInstance.getElm()
			tlv.focus();
			/* EOF sj */
			var inst = this.ne.selectedInstance;
			inst.restoreRng();
			inst.getRng().insertNode(t);

			this.ne.selectedInstance.getElm().innerHTML =
				this.ne.selectedInstance.getElm().innerHTML
					.replace('id="brd-color"',$BK('clre').checked?'bordercolor="'+$BK('clr').value+'"':'');
		}

		this.removePane();
	 },

    clSelect : function(colorCode) {
		$BK('clr').value = colorCode;
		$BK('selClr').style.backgroundColor = colorCode;
		$BK('selClr').style.color = colorCode;
	 },

    clrOpen : function() {
	   if ($BK('color').style.display == 'none') {
		  $BK('color').style.display = 'block';
	   } else {
		  $BK('color').style.display = 'none'
	   }
		  $BK('clre').checked = true;
		  $BK('table').style.display = 'none';
		  $BK('mode').value = "Hide Grid";
	 },

    clrClose : function() {
	   $BK('color').style.display = 'none'
	 },

    on : function(xx,yy) {
			for(var y=0;y<10;y++) {
				for(var x=0;x<10;x++) {
					if (x<=xx && y<=yy) {
						if ($BK('x'+x+'y'+y).style.borderColor!='#f80') {
							$BK('x'+x+'y'+y).style.borderColor = '#f80';
						}
						/* BOF swap 'rows' and 'cols' */
						$BK('cols').value = x+1;
						$BK('rows').value = y+1;
						/* EOF swap 'rows' and 'cols' */
					} else {
						if ($BK('x'+x+'y'+y).style.borderColor!='#111') {
							$BK('x'+x+'y'+y).style.borderColor = '#111';
						}
					}
				}
			}
		 },

    off : function(x,y) {
		$BK('x'+x+'y'+y).style.borderColor = '#f80';
	 },

    mode :function() {
		if ($BK('table').style.display=='none') {
		  $BK('table').style.display = 'block';
		  $BK('mode').value = "Hide Grid";
		  $BK('color').style.display = 'none';
		} else {
		  $BK('table').style.display = 'none';
		  $BK('mode').value = "Show Grid";
		}
	 },

    exit : function() {
		for(var y=0;y<10;y++) {
			for(var x=0;x<10;x++) {
					$BK('x'+x+'y'+y).style.borderColor = '#111';
			}
		}
	 }
});