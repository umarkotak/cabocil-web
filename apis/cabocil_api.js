class CabocilAPI {
  constructor() {
    if (typeof (window) !== "undefined" && window.location.protocol === "https:") {
      this.Host = "https://cabocil-api.cabocil.com"

      // production
      this.SnapJSUrl = "https://app.midtrans.com/snap/snap.js"
      this.SnapClientKey = "Mid-client-QLRT-oH6Wg3jJkjQ"

      // integration
      // this.SnapJSUrl = "https://app.sandbox.midtrans.com/snap/snap.js"
      // this.SnapClientKey = "SB-Mid-client-XwRH_ygkgDPjcIO8"
    } else {
      this.Host = "https://cabocil-api.cabocil.com"
      this.Host = "http://localhost:33000"

      // production
      // this.SnapJSUrl = "https://app.midtrans.com/snap/snap.js"
      // this.SnapClientKey = "Mid-client-QLRT-oH6Wg3jJkjQ"

      // integration
      this.SnapJSUrl = "https://app.sandbox.midtrans.com/snap/snap.js"
      this.SnapClientKey = "SB-Mid-client-XwRH_ygkgDPjcIO8"
    }
  }

  // EXAMPLE

  async SamplePost(params) {
    return this.Post(`/api/post`, "", {}, params)
  }

  async SampleGet(authToken, params) {
    return this.Get(`/api/get`, authToken, {}, params)
  }

  async SampleDelete(authToken, params) {
    return this.Delete(`/api/delete/${params.user_id}`, authToken, {}, params)
  }

  async SampleUpdate(authToken, params) {
    return this.Patch(`/api/update/${params.user_id}`, authToken, {}, params)
  }

  // ACTUAL

  async GetVideos(authToken, h, params) {
    if (localStorage.getItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`)) {
      var blacklistMap = JSON.parse(localStorage.getItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`))
      params.exclude_channel_ids = Object.keys(blacklistMap).filter((k) => blacklistMap[k]).map((k) => `${k}`).join(",")
    }

    return this.Get(`/ytkidd/api/youtube_videos`, authToken, h, params)
  }

  async GetVideoDetail(authToken, h, params) {
    return this.Get(`/ytkidd/api/youtube_video/${params.youtube_video_id}`, authToken, h, params)
  }

  async GetChannels(authToken, h, params) {
    return this.Get(`/ytkidd/api/youtube_channels`, authToken, h, params)
  }

  async GetBooks(authToken, h, params) {
    return this.Get(`/ytkidd/api/books`, authToken, h, params)
  }

  async GetBookDetail(authToken, h, params) {
    return this.Get(`/ytkidd/api/book/${params.book_id}`, authToken, h, params)
  }

  async PatchUpdateBook(authToken, h, params) {
    return this.Patch(`/ytkidd/api/book/${params.book_id}`, authToken, h, params)
  }

  async PatchUpdateBookCover(authToken, h, params) {
    return this.PatchForm(`/ytkidd/api/book/${params.get("book_id")}/cover`, authToken, h, params)
  }

  async GetChannelDetail(authToken, h, params) {
    return this.Get(`/ytkidd/api/youtube_channel/${params.channel_id}`, authToken, h, params)
  }

  async GetChannelDetailed(authToken, h, params) {
    return this.Get(`/ytkidd/api/youtube_channel/${params.channel_id}/detailed`, authToken, h, params)
  }

  async DeleteBook(authToken, h, params) {
    return this.Delete(`/ytkidd/api/book/${params.book_id}`, authToken, h, params)
  }

  async DeleteVideo(authToken, h, params) {
    return this.Delete(`/ytkidd/api/youtube_videos/${params.youtube_video_id}`, authToken, h, params)
  }

  async DeleteBookPages(authToken, h, params) {
    return this.Post(`/ytkidd/api/book/${params.book_id}/page/remove`, authToken, h, params)
  }

  async PostAIChat(authToken, h, params) {
    return this.Post(`/ytkidd/api/ai/chat`, authToken, h, params)
  }

  async PostSignUp(authToken, h, params) {
    return this.Post(`/ytkidd/api/user/sign_up`, authToken, h, params)
  }

  async PostSignIn(authToken, h, params) {
    return this.Post(`/ytkidd/api/user/sign_in`, authToken, h, params)
  }

  async PostScrapYoutubeVideos(authToken, h, params) {
    return this.Post(`/ytkidd/api/youtube/scrap_videos`, authToken, h, params)
  }

  async PatchUpdateYoutubeChannel(authToken, h, params) {
    return this.Patch(`/ytkidd/api/youtube_channel/${params.id}`, authToken, h, params)
  }

  async DeleteYoutubeChannel(authToken, h, params) {
    return this.Delete(`/ytkidd/api/youtube_channel/${params.id}`, authToken, h, params)
  }

  async GetCheckAuth(authToken, h, params) {
    return this.Get(`/ytkidd/api/user/check_auth`, authToken, h, params)
  }

  async GetComfyUIOutput(authToken, h, params) {
    return this.Get(`/ytkidd/api/comfy_ui/output`, authToken, h, params)
  }

  async GetUploadBookStatus(authToken, h, params) {
    return this.Get(`/ytkidd/api/books/upload_status`, authToken, h, params)
  }

  async PostFormInsertFromPdf(authToken, h, formData) {
    return this.PostForm(`/ytkidd/api/books/insert_from_pdf`, authToken, h, formData)
  }

  async PostCreateOrder(authToken, h, params) {
    return this.Post(`/ytkidd/api/order/create`, authToken, h, params)
  }

  async PostUserActivity(authToken, h, params) {
    return this.Post(`/ytkidd/api/user/activity`, authToken, h, params)
  }

  async GetUserActivity(authToken, h, params) {
    return this.Get(`/ytkidd/api/user/activities`, authToken, h, params)
  }

  async GetProducts(authToken, h, params) {
    return this.Get(`/ytkidd/api/products`, authToken, h, params)
  }

  async GetOrderList(authToken, h, params) {
    return this.Get(`/ytkidd/api/order/list`, authToken, h, params)
  }

  async GetUserSubscription(authToken, h, params) {
    return this.Get(`/ytkidd/api/user/subscription`, authToken, h, params)
  }

  async GetUserStroke(authToken, h, params) {
    return this.Get(`/ytkidd/api/book/user_stroke`, authToken, h, params)
  }

  async PostUserStroke(authToken, h, params) {
    return this.Post(`/ytkidd/api/book/user_stroke`, authToken, h, params)
  }

  // REUSABLE

  async Get(path, authToken, h, params) {
    var uri = `${this.GenHost()}${path}?${new URLSearchParams(params)}`
    const response = await fetch(uri, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.GenAuthToken(authToken)}`,
        'X-App-Session': this.GetSession(),
        ...h,
      }
    })
    return response
  }

  async Delete(path, authToken, h, params) {
    var uri = `${this.GenHost()}${path}?${new URLSearchParams(params)}`
    const response = await fetch(uri, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.GenAuthToken(authToken)}`,
        'X-App-Session': this.GetSession(),
        ...h,
      },
    })
    return response
  }

  async Post(path, authToken, h, params) {
    var uri = `${this.GenHost()}${path}`
    const response = await fetch(uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.GenAuthToken(authToken)}`,
        'X-App-Session': this.GetSession(),
        ...h,
      },
      body: JSON.stringify(params),
    })
    return response
  }

  async PostForm(path, authToken, h, formData) {
    var uri = `${this.GenHost()}${path}`
    const response = await fetch(uri, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.GenAuthToken(authToken)}`,
        'X-App-Session': this.GetSession(),
        ...h,
      },
      body: formData,
    })
    return response
  }

  async PatchForm(path, authToken, h, formData) {
    var uri = `${this.GenHost()}${path}`
    const response = await fetch(uri, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.GenAuthToken(authToken)}`,
        'X-App-Session': this.GetSession(),
        ...h,
      },
      body: formData,
    })
    return response
  }

  async Patch(path, authToken, h, params) {
    var uri = `${this.GenHost()}${path}`
    const response = await fetch(uri, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.GenAuthToken(authToken)}`,
        'X-App-Session': this.GetSession(),
        ...h,
      },
      body: JSON.stringify(params),
    })
    return response
  }

  GenHost() {
    try {
      // if (window && localStorage && localStorage.getItem("VDUB:SETTING:SERVER_URL") && localStorage.getItem("VDUB:SETTING:SERVER_URL") !== "") {
      //   return localStorage.getItem("VDUB:SETTING:SERVER_URL")
      // }
      return this.Host
    } catch (e) {
      return this.Host
    }
  }

  // set cookie
  SetCookie(name, value, days) {
    if (days === 0) { days = 3650 }

    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  // get cookie
  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // remove cookie
  removeCookie(name) {
    document.cookie = name + "=; Max-Age=0; path=/";
  }

  GenAuthToken(authToken) {
    if (authToken && authToken !== "") {
      return authToken;
    }
    const storedToken = this.getCookie("CK:AT");
    return storedToken || "";
  }

  GetSession() {
    let storedSession = this.getCookie("CK:SS");
    if (!storedSession) {
      storedSession = `ckss-${crypto.randomUUID()}`;
      this.SetCookie("CK:SS", storedSession, 0); // expires in 7 days
    }
    return storedSession;
  }
}

const cabocilAPI = new CabocilAPI()

export default cabocilAPI
