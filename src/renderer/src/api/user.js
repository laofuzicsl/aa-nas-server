import http from './http'
import { useConfigStore } from '../stores/config'
const configStroe = useConfigStore()

class Login {
  // 登录接口
  login(param) {
    return http.post(`${configStroe.SERVER_ADDR}/user/login`, param)
  }
}

export const loginHttp = new Login()
