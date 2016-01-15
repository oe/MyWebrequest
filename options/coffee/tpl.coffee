define (require)->

  ###*
   * Function to generate trs html
   * accepts rules
  ###
  rulesTpl = do ->
    deleteText = chrome.i18n.getMessage 'opt_delete_text'
    tpl = '''
    <tr>
       <td><input type="checkbox" value="{{ruleId}}"></td>
       <td title="{{title}}" class="{{cls}}">{{rule}}</td>
       <td class="delete">#{del}</td>
    </tr>
    '''
    tpl = tpl.replace '#{del}', deleteText

    (arr)->
      res = ''
      arr.forEach (a)->
        res += tpl.replace /\{\{(\w+)\}\}/g, ($0, $1)->
          return deleteText if $1 is 'del'
          a[ $1 ] ? $1
        return
      res

  ###*
   * String of no data tr
   * @return {[type]} [description]
  ###
  nodataTpl = do ->
    "<tr nodata>" +
      "<td colspan='3' class='text-center'>" +
      "#{chrome.i18n.getMessage 'opt_no_rules' }" +
      "</td>" +
    "</tr>"

  return {
    rulesTpl: rulesTpl
    nodataTpl: nodataTpl
  }