'use client'
import React from 'react'
import {
    Calendar,
    CircuitBoard,
    Database,
    GitBranch,
    HardDrive,
    Mail,
    MousePointerClickIcon,
    Plus,
    Slack,
    Timer,
    Webhook,
    Zap,
    Bot,
    Search,
    Code,
    BarChart3,
    PenTool,
    CheckSquare,
    Network,
} from 'lucide-react'
import { EditorCanvasTypes } from '@/lib/types'

type Props = { type: EditorCanvasTypes }

const EditorCanvasIconHelper = ({ type }: Props) => {
    switch (type) {
        case 'Email':
            return (
                <Mail
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Condition':
            return (
                <GitBranch
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'AI':
            return (
                <CircuitBoard
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Slack':
            return (
                <Slack
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Google Drive':
            return (
                <HardDrive
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Notion':
            return (
                <Database
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Custom Webhook':
            return (
                <Webhook
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Google Calendar':
            return (
                <Calendar
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Trigger':
            return (
                <MousePointerClickIcon
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Action':
            return (
                <Zap
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Wait':
            return (
                <Timer
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Agent':
            return (
                <Bot
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Research Agent':
            return (
                <Search
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Coder Agent':
            return (
                <Code
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Analyst Agent':
            return (
                <BarChart3
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Writer Agent':
            return (
                <PenTool
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Reviewer Agent':
            return (
                <CheckSquare
                    className="flex-shrink-0"
                    size={30}
                />
            )
        case 'Coordinator Agent':
            return (
                <Network
                    className="flex-shrink-0"
                    size={30}
                />
            )
        default:
            return (
                <Zap
                    className="flex-shrink-0"
                    size={30}
                />
            )
    }
}

export default EditorCanvasIconHelper
