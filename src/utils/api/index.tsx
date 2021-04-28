export function request<Request, Response>(method: string, path: string, data?: Request) {

    console.log(path)

    const onSuccess = (response: Response) => {
        return response;
    }

    const onError = (error) => {
        console.error('Request', path, ' Failed');
        return Promise.reject(error);
    }

    let urlPath = path;
    if (method == "GET") {
        urlPath += "?" + Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
    }

    return fetch(urlPath, {
        method,
        body: method == "GET" ? undefined : JSON.stringify(data),
        headers: method == "GET" ? undefined : {
            'Content-Type': 'application/json',
        },
    })
        .then((resp) => resp.json())
        .then((resp) => onSuccess(resp))
        .catch(onError);
}
