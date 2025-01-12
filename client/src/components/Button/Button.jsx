import React from 'react'

function Button({
    type = "button",
    label = "Button",
    handleClick = () => {
        console.log("Button Clicked")
    },
    className = "",
    ...props
}) {
    return (
        <button
            type={type}
            onClick={handleClick}
            className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ${className}`}
            {...props}
        >
            {label}
        </button>
    )
}

export default Button
