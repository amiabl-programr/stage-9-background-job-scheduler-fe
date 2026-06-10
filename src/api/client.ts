import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      return Promise.reject(err.response.data)
    }
    return Promise.reject(err)
  },
)

export default client
