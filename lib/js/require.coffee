ns = window.Umento = window.Umento || {}

ns.requireCache = []

ns.require = (urlOfSomeFile) ->
  #if the extension is html, we use text data type
  dataType = null
  if urlOfSomeFile.indexOf(".html", urlOfSomeFile.length - 5) isnt -1 
    dataType = "text"
  else
    #everything else is considered a script
    dataType = "script"
    #add js extension if it wasn't already there
    if  urlOfSomeFile.indexOf(".js", urlOfSomeFile.length - 3) is -1
      urlOfSomeFile += ".js"
      
  #check our cache
  for cacheItem in ns.requireCache
    if cacheItem.url is urlOfSomeFile
      return cacheItem.val

  #request file from server
  result = jQuery.ajax
    async:false
    url:urlOfSomeFile
    dataType:dataType
  
  moduleVal = result.responseText
  if (dataType is 'script')
    moduleVal = eval moduleVal
    
  ns.requireCache.push({url:urlOfSomeFile, val:moduleVal})
  
  return moduleVal