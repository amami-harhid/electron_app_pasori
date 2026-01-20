window.onload = async () => {
    const title = await window.titleApi.getTitle();
    document.title = title;
    const pageTitle = document.getElementById('pageTitle');
    pageTitle.innerHTML = title;
}
