"use client"

import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

type BlankProps = {
  number: number
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  className?: string
  inputClassName?: string
  showNumber?: boolean
}

export function PaperBlank({
  number,
  value,
  onChange,
  onFocus,
  className,
  inputClassName,
  showNumber = true,
}: BlankProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 align-baseline", className)}>
      {showNumber ? (
        <span className="font-semibold text-slate-800 dark:text-slate-100">({number})</span>
      ) : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        aria-label={`Answer ${number}`}
        className={cn(
          "h-8 rounded-none border-0 border-b border-slate-800 bg-transparent px-1 text-[15px] shadow-none focus-visible:ring-0 dark:border-slate-200",
          inputClassName,
        )}
      />
    </span>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-bold tracking-tight text-[#1e2a5a] sm:text-xl dark:text-indigo-200">
      {children}
    </h3>
  )
}

function SubTitle({ children }: { children: ReactNode }) {
  return <h4 className="text-base font-bold text-[#1e2a5a] dark:text-indigo-200">{children}</h4>
}

function Instruction({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-slate-700 dark:text-slate-200">{children}</p>
}

function MapCell({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-[4.5rem] items-center justify-center border border-slate-800 bg-white p-2 text-center text-sm font-medium text-slate-800 dark:border-slate-300 dark:bg-card dark:text-slate-100",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Questions 11–14 campus map */
export function ListeningCampusMap({
  values,
  onChange,
  onFocusBlank,
}: {
  values: [string, string, string, string]
  onChange: (index: 0 | 1 | 2 | 3, value: string) => void
  onFocusBlank?: (index: 0 | 1 | 2 | 3) => void
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <SectionTitle>SECTION 2 Questions 11 – 20</SectionTitle>
        <SubTitle>Questions 11 – 14</SubTitle>
        <Instruction>Label the locations on the map below by entering your answers on the spaces accordingly.</Instruction>
      </div>

      <div className="overflow-x-auto">
        <div className="mx-auto grid min-w-[20rem] max-w-2xl grid-cols-4 gap-2 sm:gap-3">
          <MapCell className="min-h-[5rem]" />
          <MapCell className="col-span-2 min-h-[5rem] flex-col gap-2">
            <PaperBlank
              number={14}
              value={values[3]}
              onChange={(v) => onChange(3, v)}
              onFocus={() => onFocusBlank?.(3)}
              inputClassName="w-28 sm:w-36"
            />
          </MapCell>
          <MapCell className="min-h-[5rem]" />

          <MapCell className="col-span-4 min-h-[5.5rem] flex-col gap-1 py-3">
            <span className="font-semibold">Main Lecture Hall</span>
            <span className="text-xs font-bold uppercase tracking-wide">We are here</span>
          </MapCell>

          <MapCell className="col-span-4 min-h-[3.5rem]">Car Park</MapCell>

          <MapCell className="row-span-2 min-h-[9rem] writing-mode-vertical">
            <span className="px-1 [writing-mode:vertical-rl] rotate-180 sm:[writing-mode:horizontal-tb] sm:rotate-0">
              Hall of Residence
            </span>
          </MapCell>
          <MapCell className="col-span-2 min-h-[4.5rem]">
            <PaperBlank
              number={11}
              value={values[0]}
              onChange={(v) => onChange(0, v)}
              onFocus={() => onFocusBlank?.(0)}
              inputClassName="w-28 sm:w-40"
            />
          </MapCell>
          <MapCell className="row-span-2 min-h-[9rem]">
            <PaperBlank
              number={12}
              value={values[1]}
              onChange={(v) => onChange(1, v)}
              onFocus={() => onFocusBlank?.(1)}
              inputClassName="w-24 sm:w-32"
            />
          </MapCell>

          <MapCell className="col-span-2 min-h-[4.5rem]">
            <PaperBlank
              number={13}
              value={values[2]}
              onChange={(v) => onChange(2, v)}
              onFocus={() => onFocusBlank?.(2)}
              inputClassName="w-28 sm:w-40"
            />
          </MapCell>

          <div className="col-span-3" />
          <MapCell className="min-h-[4rem]">Refectory</MapCell>
        </div>
      </div>
    </section>
  )
}

/** Questions 15–20 student facilities notes */
export function ListeningStudentFacilitiesNotes({
  values,
  onChange,
  onFocusBlank,
}: {
  values: [string, string, string, string, string, string]
  onChange: (index: 0 | 1 | 2 | 3 | 4 | 5, value: string) => void
  onFocusBlank?: (index: 0 | 1 | 2 | 3 | 4 | 5) => void
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <SubTitle>Questions 15 – 20</SubTitle>
        <Instruction>Complete the notes below.</Instruction>
        <Instruction>
          Write{" "}
          <strong className="font-bold uppercase">NO MORE THAN THREE WORDS OR A NUMBER</strong> for
          each answer.
        </Instruction>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-white dark:border-slate-300 dark:bg-card">
        <div className="border-b border-slate-300 px-4 py-3 text-center text-sm font-semibold sm:px-6 dark:border-border">
          Notes on Student Facilities
        </div>
        <div className="space-y-5 px-4 py-5 text-[15px] leading-7 text-slate-800 sm:px-6 dark:text-slate-100">
          <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
            <p className="font-semibold">Students’ Union</p>
            <ul className="list-none space-y-0.5 pl-0 sm:pl-1">
              <li>Very cheap</li>
              <li>Bookshop</li>
              <li>Food and drink available</li>
              <li>Parties!</li>
              <li>Offices - travel, welfare etc.</li>
              <li>Open 8am - 12 midnight</li>
            </ul>
          </div>

          <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
            <p className="font-semibold">Library</p>
            <ul className="list-none space-y-1 pl-0 sm:pl-1">
              <li>Must register</li>
              <li className="flex flex-wrap items-end gap-x-1 gap-y-1">
                <span>Tours every</span>
                <PaperBlank
                  number={15}
                  value={values[0]}
                  onChange={(v) => onChange(0, v)}
                  onFocus={() => onFocusBlank?.(0)}
                  inputClassName="w-28 sm:w-40"
                />
                <span>for 2 weeks.</span>
              </li>
              <li className="flex flex-wrap items-end gap-x-1 gap-y-1">
                <span>Open 9am - 9pm (later during</span>
                <PaperBlank
                  number={16}
                  value={values[1]}
                  onChange={(v) => onChange(1, v)}
                  onFocus={() => onFocusBlank?.(1)}
                  inputClassName="w-28 sm:w-40"
                />
                <span>)</span>
              </li>
            </ul>
          </div>

          <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
            <p className="font-semibold">Refectory</p>
            <ul className="list-none space-y-1 pl-0 sm:pl-1">
              <li>Cheap meals</li>
              <li>Lunch 12 noon - 3pm</li>
              <li className="flex flex-wrap items-end gap-x-1 gap-y-1">
                <span>Dinner</span>
                <PaperBlank
                  number={17}
                  value={values[2]}
                  onChange={(v) => onChange(2, v)}
                  onFocus={() => onFocusBlank?.(2)}
                  inputClassName="w-24 sm:w-32"
                />
                <span>- 8.30pm</span>
              </li>
              <li>Types of food</li>
              <li className="pl-4">- favourites</li>
              <li className="pl-4">- healthy</li>
              <li className="pl-4">- ethnic</li>
              <li className="flex flex-wrap items-end gap-x-1 gap-y-1 pl-4">
                <span>-</span>
                <PaperBlank
                  number={18}
                  value={values[3]}
                  onChange={(v) => onChange(3, v)}
                  onFocus={() => onFocusBlank?.(3)}
                  inputClassName="w-28 sm:w-36"
                />
              </li>
              <li className="pl-4">- vegan</li>
            </ul>
          </div>

          <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
            <p className="font-semibold">Sports Hall</p>
            <ul className="list-none space-y-1 pl-0 sm:pl-1">
              <li>Must join Athletic Union which</li>
              <li className="pl-4">- lets me use facilities</li>
              <li className="pl-4">- lets me play for teams</li>
              <li className="flex flex-wrap items-end gap-x-1 gap-y-1 pl-4">
                <span>-</span>
                <PaperBlank
                  number={19}
                  value={values[4]}
                  onChange={(v) => onChange(4, v)}
                  onFocus={() => onFocusBlank?.(4)}
                  inputClassName="w-28 sm:w-40"
                />
                <span>me all year</span>
              </li>
            </ul>
          </div>

          <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
            <p className="font-semibold">Discount Card</p>
            <ul className="list-none space-y-1 pl-0 sm:pl-1">
              <li className="flex flex-wrap items-end gap-x-1 gap-y-1">
                <span>Costs</span>
                <span className="font-semibold">(20)</span>
                <span>£</span>
                <PaperBlank
                  number={20}
                  value={values[5]}
                  onChange={(v) => onChange(5, v)}
                  onFocus={() => onFocusBlank?.(5)}
                  showNumber={false}
                  inputClassName="w-24 sm:w-32"
                />
              </li>
              <li>Gives me discounts on all uni. services</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Questions 21–25 John / Jane table */
export function ListeningJohnJaneTable({
  values,
  onChange,
  onFocusBlank,
}: {
  values: [string, string, string, string, string]
  onChange: (index: 0 | 1 | 2 | 3 | 4, value: string) => void
  onFocusBlank?: (index: 0 | 1 | 2 | 3 | 4) => void
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <SectionTitle>SECTION 3 Questions 21 – 30</SectionTitle>
        <SubTitle>Questions 21 – 25</SubTitle>
        <Instruction>Complete the table below.</Instruction>
        <Instruction>
          Write <strong className="font-bold uppercase">NO MORE THAN THREE WORDS</strong> for each
          answer.
        </Instruction>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-border">
        <table className="w-full min-w-[32rem] border-collapse text-left text-[14px] text-slate-800 dark:text-slate-100">
          <thead>
            <tr className="bg-slate-100 dark:bg-muted">
              <th className="border border-slate-300 px-3 py-2 font-semibold dark:border-border" />
              <th className="border border-slate-300 px-3 py-2 font-semibold dark:border-border">
                John
              </th>
              <th className="border border-slate-300 px-3 py-2 font-semibold dark:border-border">
                Jane
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                Day of Arrival
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">Thursday</td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <PaperBlank
                  number={21}
                  value={values[0]}
                  onChange={(v) => onChange(0, v)}
                  onFocus={() => onFocusBlank?.(0)}
                  inputClassName="w-28 sm:w-36"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                Subjects Studying
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <div>economics</div>
                <div>maths</div>
                <div>french</div>
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <div className="mb-1">
                  <PaperBlank
                    number={22}
                    value={values[1]}
                    onChange={(v) => onChange(1, v)}
                    onFocus={() => onFocusBlank?.(1)}
                    inputClassName="w-28 sm:w-36"
                  />
                </div>
                <div>history</div>
                <div>music</div>
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                Monday’s 9am lecture
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">french</td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">history</td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                Monday’s 2pm lecture
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">maths</td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <PaperBlank
                  number={23}
                  value={values[2]}
                  onChange={(v) => onChange(2, v)}
                  onFocus={() => onFocusBlank?.(2)}
                  inputClassName="w-28 sm:w-36"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                Wednesday afternoon sport selected
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <PaperBlank
                  number={24}
                  value={values[3]}
                  onChange={(v) => onChange(3, v)}
                  onFocus={() => onFocusBlank?.(3)}
                  inputClassName="w-28 sm:w-36"
                />
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">volleyball</td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                Location of Sport
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">sports hall</td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <PaperBlank
                  number={25}
                  value={values[4]}
                  onChange={(v) => onChange(4, v)}
                  onFocus={() => onFocusBlank?.(4)}
                  inputClassName="w-32 sm:w-44"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Questions 26–29 short answers */
export function ListeningShortAnswers2629({
  values,
  onChange,
  onFocusBlank,
}: {
  values: [string, string, string, string]
  onChange: (index: 0 | 1 | 2 | 3, value: string) => void
  onFocusBlank?: (index: 0 | 1 | 2 | 3) => void
}) {
  const items: Array<{
    n: number
    prompt: string
    index: 0 | 1 | 2 | 3
    suffix?: string
  }> = [
    {
      n: 26,
      prompt: "Students can choose from how many essay titles for their first assignment?",
      index: 0,
    },
    {
      n: 27,
      prompt: "Where did John travel during the summer?",
      index: 1,
    },
    {
      n: 28,
      prompt: "What is the word limit for the essays?",
      index: 2,
      suffix: "words",
    },
    {
      n: 29,
      prompt: "When must the first essay be handed in by?",
      index: 3,
    },
  ]

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <SubTitle>Questions 26 – 29</SubTitle>
        <Instruction>
          Write{" "}
          <strong className="font-bold uppercase">NO MORE THAN THREE WORDS OR A NUMBER</strong> for
          each answer.
        </Instruction>
      </div>
      {items.map((item) => (
        <div key={item.n} className="space-y-2">
          <p className="text-[15px] text-slate-800 dark:text-slate-100">
            <span className="font-semibold">{item.n}</span> {item.prompt}
          </p>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 dark:border-border dark:bg-card">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={values[item.index]}
                onChange={(e) => onChange(item.index, e.target.value)}
                onFocus={() => onFocusBlank?.(item.index)}
                aria-label={`Answer ${item.n}`}
                className="h-9 w-40 border-slate-300 sm:w-52"
              />
              {item.suffix ? (
                <span className="text-[15px] text-slate-700 dark:text-slate-200">{item.suffix}</span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

type McQuestion = {
  id: string
  number: number
  prompt: string
  options: { id: string; text: string }[]
  value: string
}

/** Questions 31–34 multiple choice paper layout */
export function ListeningMcSection3134({
  title,
  subtitle,
  instruction,
  questions,
  onChange,
  onFocus,
}: {
  title?: string
  subtitle: string
  instruction: string
  questions: McQuestion[]
  onChange: (questionId: string, value: string) => void
  onFocus?: (questionId: string) => void
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        {title ? <SectionTitle>{title}</SectionTitle> : null}
        <SubTitle>{subtitle}</SubTitle>
        <Instruction>{instruction}</Instruction>
      </div>
      {questions.map((q) => (
        <div key={q.id} className="space-y-3">
          <p className="text-[15px] text-slate-800 dark:text-slate-100">
            <span className="font-semibold">{q.number}</span> {q.prompt}
          </p>
          <RadioGroup
            value={q.value || undefined}
            onValueChange={(v) => {
              onFocus?.(q.id)
              onChange(q.id, v)
            }}
            className="space-y-2"
          >
            {q.options.map((opt) => (
              <div
                key={opt.id}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-border dark:bg-card"
              >
                <RadioGroupItem
                  value={opt.id}
                  id={`${q.id}-${opt.id}`}
                  className="mt-0.5 border-slate-400"
                />
                <Label
                  htmlFor={`${q.id}-${opt.id}`}
                  className="flex-1 cursor-pointer font-normal leading-relaxed text-slate-800 dark:text-slate-100"
                >
                  {opt.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
    </section>
  )
}

/** Questions 35–39 oil techniques table */
export function ListeningOilTechniquesTable({
  values,
  onChange,
  onFocusBlank,
}: {
  values: [string, string, string, string, string]
  onChange: (index: 0 | 1 | 2 | 3 | 4, value: string) => void
  onFocusBlank?: (index: 0 | 1 | 2 | 3 | 4) => void
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <SubTitle>Questions 35 – 39</SubTitle>
        <Instruction>Compare the notes below.</Instruction>
        <Instruction>
          Write <strong className="font-bold uppercase">NO MORE THAN THREE WORDS</strong>.
        </Instruction>
        <p className="pt-1 text-[15px] font-semibold text-slate-800 dark:text-slate-100">
          Oil exploration clean-up techniques
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-border">
        <table className="w-full min-w-[40rem] border-collapse text-left text-[14px] text-slate-800 dark:text-slate-100">
          <thead>
            <tr className="bg-slate-100 dark:bg-muted">
              <th className="border border-slate-300 px-3 py-2 font-semibold dark:border-border">
                Techniques
              </th>
              <th className="border border-slate-300 px-3 py-2 font-semibold dark:border-border">
                Advantages
              </th>
              <th className="border border-slate-300 px-3 py-2 font-semibold dark:border-border">
                Disadvantages
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                The Containment Boom
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">Cheap and easy</td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <div className="flex flex-wrap items-end gap-1">
                  <span>Only good when there are</span>
                  <PaperBlank
                    number={35}
                    value={values[0]}
                    onChange={(v) => onChange(0, v)}
                    onFocus={() => onFocusBlank?.(0)}
                    inputClassName="w-28 sm:w-40"
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                Chemical Detergents
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <div className="flex flex-wrap items-end gap-1">
                  <span>Good for treating</span>
                  <PaperBlank
                    number={36}
                    value={values[1]}
                    onChange={(v) => onChange(1, v)}
                    onFocus={() => onFocusBlank?.(1)}
                    inputClassName="w-28 sm:w-40"
                  />
                </div>
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                Chemicals remain in the water + kill marine life.
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                The Sponge
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                Oil remains permanently in the sponge.
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <div className="flex flex-wrap items-end gap-1">
                  <span>The sponge mats turn into</span>
                  <PaperBlank
                    number={37}
                    value={values[2]}
                    onChange={(v) => onChange(2, v)}
                    onFocus={() => onFocusBlank?.(2)}
                    inputClassName="w-28 sm:w-40"
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium dark:border-border">
                Bacteria
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <div>Cheap</div>
                <div>Easy to administer</div>
                <div className="mt-1 flex flex-wrap items-end gap-1">
                  <span>Totally</span>
                  <PaperBlank
                    number={38}
                    value={values[3]}
                    onChange={(v) => onChange(3, v)}
                    onFocus={() => onFocusBlank?.(3)}
                    inputClassName="w-28 sm:w-40"
                  />
                </div>
              </td>
              <td className="border border-slate-300 px-3 py-3 dark:border-border">
                <PaperBlank
                  number={39}
                  value={values[4]}
                  onChange={(v) => onChange(4, v)}
                  onFocus={() => onFocusBlank?.(4)}
                  inputClassName="w-36 sm:w-48"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Question 40 notice boards */
export function ListeningQuestion40({
  value,
  onChange,
  onFocus,
}: {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <SubTitle>Question 40</SubTitle>
        <Instruction>
          Write <strong className="font-bold uppercase">NO MORE THAN THREE WORDS</strong>.
        </Instruction>
      </div>
      <p className="text-[15px] leading-7 text-slate-800 dark:text-slate-100">
        Optional essay question. Remember to check out the faculty’s notice boards. You will find:
      </p>
      <ul className="list-disc space-y-2 pl-6 text-[15px] text-slate-800 dark:text-slate-100">
        <li>reading lists</li>
        <li>essay questions</li>
        <li className="flex list-item flex-wrap items-end gap-2">
          <PaperBlank
            number={40}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            inputClassName="w-40 sm:w-56"
          />
        </li>
      </ul>
    </section>
  )
}
