// generate common user agent
const UserAgent = require('user-agents')

const filters = {
  tablet: [/iPad.*Safari/, /Android/],
  mobile: [/iPhone/, /Samsung/],
  desktop: [/MSIE 8/, /MSIE 10/]
}

function getUa (type, pattern) {
  try {
    const ua = new UserAgent([pattern, { deviceCategory: type }])
    return ua.toString()
  } catch (error) {
    console.log(type, pattern)
    console.log(error)
  }
}

function getUas (filters) {
  const result = []
  Object.keys(filters)
    .map(t => {
      return filters[t].map(p => getUa(t, p))
    })
    .reduce((acc, cur) => {
      acc.push(...cur)
      return acc
    }, result)
  return result
}

console.log(getUas(filters).join('\n'))
