import Vue from 'vue'
import Router from 'vue-router'
import UploadHeadImage from '@/components/UploadHeadImages'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'UploadHeadImage',
      component: UploadHeadImage
    }
  ]
})
