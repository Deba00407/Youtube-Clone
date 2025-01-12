import React, { useState } from 'react'
import { forwardRef } from 'react'

function Input({
    type = "text",
    placeholder = "",
    className = "",
    name = "",
    label = "",
    ...props
}, ref) {
    const [value, setValue] = useState("")
    return (
        <div className="mb-6">
            <label
                htmlFor={name}
                className="block text-sm font-medium text-gray-700"
            >
                {label}
            </label>
            <input
                ref={ref}
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className={"mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" + `${className}`}
                {...props}
            />
        </div>
    )
}

export default forwardRef(Input)
