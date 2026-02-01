import clsx from 'clsx'
import React from 'react'

type Props = { selected: boolean }

const Agents = ({ selected }: Props) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Multi-agent brain icon */}
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
        className={clsx(
          'dark:group-hover:fill-[#C8C7FF] transition-all dark:fill-[#353346] fill-[#BABABB] group-hover:fill-[#7540A9]',
          { 'dark:!fill-[#C8C7FF] !fill-[#7540A9]': selected }
        )}
      />
      {/* Neural dots */}
      <circle cx="9" cy="8" r="1.2" fill={selected ? '#1a1a2e' : '#5B5966'} className="dark:fill-[#1a1a2e]" />
      <circle cx="15" cy="8" r="1.2" fill={selected ? '#1a1a2e' : '#5B5966'} className="dark:fill-[#1a1a2e]" />
      <circle cx="12" cy="12" r="1.2" fill={selected ? '#1a1a2e' : '#5B5966'} className="dark:fill-[#1a1a2e]" />
      {/* Connection legs */}
      <path
        d="M9 18v3M12 18v4M15 18v3"
        stroke={selected ? '#C8C7FF' : '#5B5966'}
        strokeWidth="2"
        strokeLinecap="round"
        className={clsx(
          'dark:group-hover:stroke-[#C8C7FF] transition-all group-hover:stroke-[#7540A9]',
          { 'dark:!stroke-[#C8C7FF] !stroke-[#7540A9]': selected }
        )}
      />
    </svg>
  )
}

export default Agents
