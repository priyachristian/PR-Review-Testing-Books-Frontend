import { Form } from '../../AntDComponent';

const CustomForm = ({ name, layout = 'vertical', initialValues = {}, onFinish, onFinishFailed, children, onKeyDown, ...props }) => {
  return (
    <div>
      <Form
        name={name}
        layout={layout}
        initialValues={initialValues}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        onKeyDown={e => {
          if (onKeyDown) {
            onKeyDown(e);
          } else {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }
        }}
        {...props}
      >
        {children}
      </Form>
    </div>
  );
};

export default CustomForm;
