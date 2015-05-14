define (require)->

  ###*
   * Function to generate trs html
   * accepts rules
  ###
  rulesTpl = do ->
    deleteText = chrome.i18n.getMessage 'opt_delete_text'
    tpl = '''
    {{ _.each(function(rule){ }}
    <tr>
       <td><input type="checkbox" value="{{=rule}}"></td>
       <td title="{{=rule}}">{{=rule}}</td>
       <td class="delete">#{del}</td>
    </tr>
    {{ }) }}
    '''
    tpl = tpl.replace '#{del}', deleteText

    _.template tpl

  ###*
   * String of no data tr
   * @return {[type]} [description]
  ###
  nodataTpl = do ->
    "<tr nodata>" +
      "<td colspan='3' class='align-center'>" +
      "#{chrome.i18n.getMessage 'opt_no_rules' }" +
      "</td>" +
    "</tr>"

  return {
    rulesTpl: rulesTpl
    nodataTpl: nodataTpl
  }