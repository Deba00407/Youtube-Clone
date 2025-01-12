import React, { useRef } from 'react'
import Input from '../Input/Input'
import Button from '../Button/Button'

function SignUp() {
    const usernameRef = useRef("")
    const fullnameRef = useRef("")
    const emailRef = useRef("")
    const passwordRef = useRef("")
    const confirmPasswordRef = useRef("")
    const avatarRef = useRef("")

    const handleSubmit = (e) => {
        e.preventDefault();
        const username = usernameRef.current.value;
        console.log(username)
    }

    return (
        <div className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
                    Sign Up
                </h2>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    {/* Fullname Field */}
                    <Input
                        ref={fullnameRef}
                        label="Enter your fullname"
                        placeholder="Fullname"
                        name="fullname"
                        required
                    />

                    {/* Username Field */}
                    <Input
                        ref={usernameRef}
                        label="Enter your username"
                        placeholder="Username"
                        name="username"
                        required
                    />

                    {/* Email Field */}
                    <Input
                        ref={emailRef}
                        label="Enter your email"
                        placeholder="Email"
                        name="email"
                        type="email"
                        required
                    />

                    {/* Password Field */}
                    <Input
                        ref={passwordRef}
                        label="Enter your password"
                        placeholder="Password"
                        name="password"
                        type="password"
                        required
                    />

                    {/* Confirm Password Field */}
                    <Input
                        ref={confirmPasswordRef}
                        label="Confirm your password"
                        placeholder="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        required
                    />

                    {/* Avatar Field */}
                    <Input
                        ref={avatarRef}
                        label="Upload your avatar"
                        name="avatar"
                        type="file"
                    />

                    {/* Submit Button */}
                    <Button
                        label="Sign Up"
                        type="submit"
                        handleClick={handleSubmit}
                        className="mt-6 w-full hover:bg-blue-900"
                    />
                </form>
            </div>
        </div>

    )
}

export default SignUp
