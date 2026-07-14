"use client"

import { useState } from "react"
import { format } from "date-fns"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card } from "@/components/ui/card"
import { TrendingUp, Users, BookOpen, Clock, BarChart3, Calendar as CalendarIcon, Filter } from "lucide-react"
import { AreaChart, BarChart, DonutChart, LineChart } from "@tremor/react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GrowHeader } from "@/components/grow-shell"
import { cn } from "@/lib/utils"

const enrollmentData = [
  { month: "Jan", "Total Enrollments": 850 },
  { month: "Feb", "Total Enrollments": 709 },
  { month: "Mar", "Total Enrollments": 922 },
  { month: "Apr", "Total Enrollments": 500 },
  { month: "May", "Total Enrollments": 259 },
  { month: "Jun", "Total Enrollments": 342 },
]

const popularCoursesData = [
  { name: "ACLS Course", "Students": 2450 },
  { name: "BLS Training", "Students": 1800 },
  { name: "First Aid", "Students": 1650 },
  { name: "HSE Oil & Gas", "Students": 1200 },
  { name: "Electrical Safety", "Students": 950 },
]

const categoryData = [
  { name: "Safety", amount: 4500 },
  { name: "Health", amount: 3000 },
  { name: "Oil & Gas", amount: 2525 },
]

const engagementData = [
  { month: "Jan", "Engagement Rate": 82 },
  { month: "Feb", "Engagement Rate": 85 },
  { month: "Mar", "Engagement Rate": 88 },
  { month: "Apr", "Engagement Rate": 92 },
  { month: "May", "Engagement Rate": 95 },
  { month: "Jun", "Engagement Rate": 98 },
]

export default function AdminAnalyticsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 0, 1))
  const [range, setRange] = useState("2025")

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <GrowHeader
          icon={BarChart3}
          title="Analytics"
          accent="see the impact"
          description={`Platform performance overview for ${range === "2025" ? "Year 2025" : range}`}
          showDate={false}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="2025">Year 2025</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal bg-card",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Custom Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="secondary" size="icon" className="md:flex hidden">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </GrowHeader>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Total Enrollments", value: "10,025", icon: Users, color: "text-blue-500" },
            { title: "Course Completions", value: "9,807", icon: BookOpen, color: "text-yellow-500" },
            { title: "Avg. Completion Time", value: "3 weeks", icon: Clock, color: "text-green-500" },
            { title: "Engagement Rate", value: "98%", icon: TrendingUp, color: "text-purple-500" },
          ].map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card
                key={metric.title}
                className="p-6 transition-smooth hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{metric.value}</p>
                  </div>
                  <div className={`rounded-full bg-accent p-3 ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Enrollment Trends */}
          <Card className="p-6 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Enrollment Trends</h3>
                <p className="text-sm text-muted-foreground">Monthly growth overview</p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <AreaChart
              className="h-72 mt-4"
              data={enrollmentData}
              index="month"
              categories={["Total Enrollments"]}
              colors={["blue"]}
              valueFormatter={(number: number) => Intl.NumberFormat("us").format(number).toString()}
              yAxisWidth={60}
              showAnimation={true}
              showLegend={false}
            />
          </Card>

          {/* Popular Courses */}
          <Card className="p-6 animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Popular Courses</h3>
                <p className="text-sm text-muted-foreground">Training demand by course</p>
              </div>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <BarChart
              className="h-72 mt-4"
              data={popularCoursesData}
              index="name"
              categories={["Students"]}
              colors={["purple"]}
              valueFormatter={(number: number) => Intl.NumberFormat("us").format(number).toString()}
              yAxisWidth={48}
              showAnimation={true}
              layout="vertical"
              showLegend={false}
            />
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Distribution */}
          <Card className="p-6 animate-slide-up" style={{ animationDelay: "0.7s" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Enrollment by Category</h3>
                <p className="text-sm text-muted-foreground">Course distribution breakdown</p>
              </div>
              <BookOpen className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <DonutChart
                className="h-72 w-full md:w-1/2"
                data={categoryData}
                category="amount"
                index="name"
                colors={["blue", "yellow", "teal"]}
                valueFormatter={(number: number) => Intl.NumberFormat("us").format(number).toString()}
                showAnimation={true}
              />
              <div className="flex-1 space-y-4">
                {categoryData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full bg-${idx === 0 ? 'blue-500' : idx === 1 ? 'yellow-500' : 'teal-500'}`} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{Intl.NumberFormat("us").format(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Engagement Trend */}
          <Card className="p-6 animate-slide-up" style={{ animationDelay: "0.8s" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Engagement Over Time</h3>
                <p className="text-sm text-muted-foreground">Active user participation rate</p>
              </div>
              <BarChart3 className="h-5 w-5 text-green-500" />
            </div>
            <LineChart
              className="h-72 mt-4"
              data={engagementData}
              index="month"
              categories={["Engagement Rate"]}
              colors={["green"]}
              valueFormatter={(number: number) => `${number}%`}
              yAxisWidth={48}
              showAnimation={true}
              showLegend={false}
            />
          </Card>
        </div>
      </div>
    </GrowMainLayout>
  )
}
