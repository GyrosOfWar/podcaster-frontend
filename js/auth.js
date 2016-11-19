import $ from 'jquery'

module.exports = {
    login(username, password, callback) {
        const loginData = {username: username, password: password}
        $.ajax({
            url: '/auth/token',
            method: 'POST',
            dataType: 'json',
            data: JSON.stringify(loginData),
            contentType: 'application/json',
            success: function (response) {
                const token = response.token
                localStorage.setItem('token', token)
                callback(response)
            }
        })
    },

    // TODO check for token expiration
    isLoggedIn() {
        return localStorage.getItem('token') !== null
    },

    getToken() {
        return localStorage.getItem('token')
    },

    logout(callback) {
        localStorage.removeItem('token')
        if (callback) {
            callback()
        }
    }
}