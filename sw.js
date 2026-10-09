// 工具栏图标点击 -> 在新标签页打开导航面板。
// 注意：MV3 中绑定 action 点击必须借助 service worker（即便扩展只用 newtab override），
// 因此不能删除本文件，否则点击图标将无任何反应。
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
