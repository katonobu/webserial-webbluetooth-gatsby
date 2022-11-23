# redux
### 履歴
[gatsby-example-redux](https://github.com/gatsbyjs/gatsby/tree/master/examples/using-redux)をとってきて、
そこから必要最低限のファイル群をコピー

## 懸念
- actionのpayloadにSerialPort objectを渡してmiddlewareの先でopenとかしたいが、できるのか?
- そもともthunkの先っちょでオープンしてそのオブジェクトを回しっぱなしとかって大丈夫なの?
- gatsby-reduxの組み合わせでredux-tools使えるの?

## 参照リンク
### Gatsby + redux
- [Adding a Redux Store](https://www.gatsbyjs.com/docs/adding-redux-store/)
  - Wrap the root element in your Gatsby markup once using wrapRootElement, an API supporting both Gatsby’s server rendering and browser JavaScript processes.
  - Create a custom Redux store with reducers and initial state, providing your own state management functionality outside of Gatsby.
  - [example:using-redux](https://github.com/gatsbyjs/gatsby/tree/master/examples/using-redux)
- [Using Gatsby + Redux While Preserving Site Performance](https://www.gatsbyjs.com/blog/using-gatsby-redux-while-preserving-site-performance/)
  - [example:using-redux](https://github.com/gatsbyjs/gatsby/tree/master/examples/using-redux)
  - [using-redux-w-interaction-code-splitting](https://github.com/gatsbyjs/gatsby/tree/master/examples/using-redux-w-interaction-code-splitting)
  - [using-redux-w-page-code-splitting](https://github.com/gatsbyjs/gatsby/tree/master/examples/using-redux-w-page-code-splitting)
- [Gatsby.jsでreact-reduxを使う方法](https://qiita.com/akki-memo/items/4584ff42920fabdc7a57)


### redux
#### 図がわかりやすい
- [【入門編】Reduxによる状態管理の仕組みを理解する](https://zenn.dev/jojo/articles/25c10b27783093)
  - [Redux. From twitter hype to production](https://slides.com/jenyaterpil/redux-from-twitter-hype-to-production)
- [お前らのReactは遅すぎる(SSG編)](https://qiita.com/teradonburi/items/09724de3738a25dfe8ba)
  - [初回ロード時の処理の絵](https://camo.qiitausercontent.com/58d8557f011351c893b9c956f67afd55b90dd743/68747470733a2f2f71696974612d696d6167652d73746f72652e73332e61702d6e6f727468656173742d312e616d617a6f6e6177732e636f6d2f302f35353037372f63636164306339352d316333362d666138392d663966662d6364633537636631373063362e706e67)
- [Gatsby + React + Redux によるゼロリスク・ハイリターンな個人開発](https://speakerdeck.com/taumu/gatsby-plus-react-plus-redux-niyoruzerorisukuhairitannage-ren-kai-fa)

- [Redux Toolkit また(自分が)忘れないための基本まとめ](https://dev.classmethod.jp/articles/rtk-my-memorandum/)

- [HookとRedux ToolkitでReact Reduxに入門する](https://www.hypertextcandy.com/learn-react-redux-with-hooks-and-redux-starter-kit)
- [React Reduxには今後Redux Toolkitも使うのがいいと思う](https://qiita.com/shikazuki/items/02fb27dc741cbff18811)
- [Redux Middleware – What it is and How to Build it from Scratch](https://www.freecodecamp.org/news/what-is-redux-middleware-and-how-to-create-one-from-scratch/)
